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

  try {
    const { fields } = await parseForm(req);

    const get = (f) => (Array.isArray(fields[f]) ? fields[f][0] : fields[f] || '');

    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    const complaintId = `TVK-${ymd}-${rand}`;

    const { error } = await supabase.from('complaints').insert([{
      complaint_id: complaintId,
      name:         get('name'),
      mobile:       get('mobile'),
      ward_number:  get('wardNumber'),
      area:         get('area'),
      category:     get('category'),
      description:  get('description'),
      landmark:     get('landmark'),
      photo:        '',
    }]);

    if (error) throw error;

    return res.status(201).json({ complaintId, message: 'Complaint registered successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
