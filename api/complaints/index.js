import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

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
      const body = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';
      const boundary = contentType.split('boundary=')[1];
      if (!boundary) return reject(new Error('No boundary in multipart'));

      const fields = {};
      const files  = {};
      const parts  = body.toString('binary').split('--' + boundary);

      for (const part of parts) {
        if (!part.includes('Content-Disposition')) continue;
        const [headerSection, ...bodyParts] = part.split('\r\n\r\n');
        const bodyContent = bodyParts.join('\r\n\r\n').replace(/\r\n$/, '');
        const nameMatch  = headerSection.match(/name="([^"]+)"/);
        const fileMatch  = headerSection.match(/filename="([^"]+)"/);
        if (!nameMatch) continue;
        const fieldName = nameMatch[1];
        if (fileMatch) {
          const ctMatch = headerSection.match(/Content-Type:\s*([^\r\n]+)/i);
          files[fieldName] = {
            originalFilename: fileMatch[1],
            contentType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream',
            buffer: Buffer.from(bodyContent, 'binary'),
          };
        } else {
          fields[fieldName] = bodyContent;
        }
      }
      resolve({ fields, files });
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: 'Database not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables.' });
  }

  try {
    const { fields, files } = await parseForm(req);
    const get = f => fields[f] || '';

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
        const ext      = (photoFile.originalFilename || '').split('.').pop().toLowerCase() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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

    const date = new Date();
    const ymd  = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    const complaintId = `TVK-${ymd}-${rand}`;

    const { error } = await supabase.from('complaints').insert([{
      complaint_id: complaintId,
      name, mobile, ward_number, area, category, description, landmark,
      photo: photoUrl,
    }]);

    if (error) {
      return res.status(500).json({ error: 'DB insert failed: ' + error.message, code: error.code });
    }

    return res.status(201).json({ complaintId, message: 'Complaint registered successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
