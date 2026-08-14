import 'dotenv/config';
import { connectDB } from '../../lib/db.js';
import Complaint from '../../models/Complaint.js';
import { verifyToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await connectDB();
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    return res.status(200).json(complaints);
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
