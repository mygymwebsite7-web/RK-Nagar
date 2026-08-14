import 'dotenv/config';
import multiparty from 'multiparty';
import cloudinary from 'cloudinary';
import { supabase } from '../../lib/supabase.js';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

function uploadToCloudinary(filePath) {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(filePath, { folder: 'tvk-complaints' }, (err, result) => {
      if (err) reject(err);
      else resolve(result.secure_url);
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
    const { fields, files } = await parseForm(req);

    const get = (f) => (Array.isArray(fields[f]) ? fields[f][0] : fields[f] || '');

    let photoUrl = '';
    if (files.photo && files.photo[0]) {
      photoUrl = await uploadToCloudinary(files.photo[0].path);
    }

    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    const complaintId = `TVK-${ymd}-${rand}`;

    const { error } = await supabase.from('complaints').insert([{
      complaintId,
      name:       get('name'),
      mobile:     get('mobile'),
      wardNumber: get('wardNumber'),
      area:       get('area'),
      category:   get('category'),
      description:get('description'),
      landmark:   get('landmark'),
      photo:      photoUrl,
    }]);

    if (error) throw error;

    return res.status(201).json({ complaintId, message: 'Complaint registered successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
