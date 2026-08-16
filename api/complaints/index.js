import 'dotenv/config';
import multiparty from 'multiparty';
import { supabase } from '../../lib/supabase.js';

export const config = { api: { bodyParser: false } };

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Guard: supabase client missing means env vars not set
  if (!supabase) {
    return res.status(500).json({ error: 'Server misconfiguration: Supabase credentials missing' });
  }

  try {
    const { fields } = await parseForm(req);
    const get = (f) => (Array.isArray(fields[f]) ? fields[f][0] : fields[f] || '');

    const name        = get('name');
    const mobile      = get('mobile');
    const ward_number = get('wardNumber');
    const area        = get('area');
    const category    = get('category');
    const description = get('description');
    const landmark    = get('landmark');

    // Validate required fields
    if (!name || !mobile || !ward_number || !area || !category || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        received: { name: !!name, mobile: !!mobile, ward_number: !!ward_number, area: !!area, category: !!category, description: !!description },
      });
    }

    const date = new Date();
    const ymd  = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    const complaintId = `TVK-${ymd}-${rand}`;

    const { error } = await supabase.from('complaints').insert([{
      complaint_id: complaintId,
      name,
      mobile,
      ward_number,
      area,
      category,
      description,
      landmark,
      photo: '',
    }]);

    if (error) {
      return res.status(500).json({ error: 'DB insert failed: ' + error.message, code: error.code });
    }

    return res.status(201).json({ complaintId, message: 'Complaint registered successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
