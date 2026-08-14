import 'dotenv/config';
import { connectDB } from '../../lib/db.js';
import Complaint from '../../models/Complaint.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { complaintId } = req.query;

  try {
    await connectDB();
    const complaint = await Complaint.findOne({ complaintId });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    return res.status(200).json(complaint);
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
