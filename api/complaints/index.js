const { createClient } = require('@supabase/supabase-js');

module.exports.config = { api: { bodyParser: false } };

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks);
        const contentType = req.headers['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
        if (!boundaryMatch) return reject(new Error('No boundary in multipart'));
        const boundary = boundaryMatch[1].trim();

        const fields = {};
        const files  = {};
        const delimBuf = Buffer.from('\r\n--' + boundary);
        const bodyWithPreamble = Buffer.concat([Buffer.from('\r\n'), body]);

        let start = bodyWithPreamble.indexOf('\r\n--' + boundary);
        while (start !== -1) {
          const headerStart = start + delimBuf.length + 2; // skip \r\n after boundary
          const headerEnd   = bodyWithPreamble.indexOf('\r\n\r\n', headerStart);
          if (headerEnd === -1) break;
          const headers = bodyWithPreamble.slice(headerStart, headerEnd).toString();
          const next    = bodyWithPreamble.indexOf('\r\n--' + boundary, headerEnd + 4);
          const partBody = next === -1
            ? bodyWithPreamble.slice(headerEnd + 4)
            : bodyWithPreamble.slice(headerEnd + 4, next);

          const nameMatch = headers.match(/name="([^"]+)"/i);
          const fileMatch = headers.match(/filename="([^"]*)"/i);
          if (!nameMatch) { start = next; continue; }
          const fieldName = nameMatch[1];

          if (fileMatch) {
            const ctMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
            files[fieldName] = {
              originalFilename: fileMatch[1],
              contentType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream',
              buffer: partBody,
            };
          } else {
            fields[fieldName] = partBody.toString();
          }
          start = next;
        }
        resolve({ fields, files });
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

module.exports.default = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({
      error: 'Database not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel → Settings → Environment Variables, then redeploy.'
    });
  }

  try {
    const { fields, files } = await parseForm(req);
    const get = f => (fields[f] || '').trim();

    const name        = get('name');
    const mobile      = get('mobile');
    const ward_number = get('wardNumber');
    const area        = get('area');
    const category    = get('category');
    const description = get('description');
    const landmark    = get('landmark');

    if (!name || !mobile || !ward_number || !area || !category || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Upload photo if provided
    let photoUrl = '';
    const photoFile = files.photo;
    if (photoFile && photoFile.buffer && photoFile.buffer.length > 0) {
      try {
        const ext      = (photoFile.originalFilename || 'jpg').split('.').pop().toLowerCase() || 'jpg';
        const fileName = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
        const { error: uploadError } = await supabase.storage
          .from('complaint-photos')
          .upload(fileName, photoFile.buffer, {
            contentType: photoFile.contentType || 'image/jpeg',
            upsert: false,
          });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('complaint-photos').getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      } catch (_) { /* continue without photo */ }
    }

    const now  = new Date();
    const ymd  = now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0');
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    const complaintId = 'TVK-' + ymd + '-' + rand;

    const { error: dbErr } = await supabase.from('complaints').insert([{
      complaint_id: complaintId,
      name, mobile, ward_number, area, category, description, landmark,
      photo: photoUrl,
    }]);

    if (dbErr) {
      return res.status(500).json({ error: 'DB insert failed: ' + dbErr.message, code: dbErr.code });
    }

    return res.status(201).json({ complaintId, message: 'Complaint registered successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
