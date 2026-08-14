import 'dotenv/config';
import { connectDB } from '../../lib/db.js';
import Complaint from '../../models/Complaint.js';
import { verifyToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;

  // Vercel may pass body as string; parse it if needed
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { status } = body;

  const allowed = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    await connectDB();
    const complaint = await Complaint.findByIdAndUpdate(id, { status }, { new: true });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    return res.status(200).json(complaint);
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
