import 'dotenv/config';
import { connectDB } from '../../lib/db.js';
import Complaint from '../../models/Complaint.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();

    const total      = await Complaint.countDocuments();
    const pending    = await Complaint.countDocuments({ status: 'Submitted' });
    const underReview= await Complaint.countDocuments({ status: 'Under Review' });
    const assigned   = await Complaint.countDocuments({ status: 'Assigned' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved   = await Complaint.countDocuments({ status: 'Resolved' });

    const wardAgg = await Complaint.aggregate([
      { $group: { _id: '$wardNumber', count: { $sum: 1 }, topCategory: { $first: '$category' } } },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({ total, pending, underReview, assigned, inProgress, resolved, wards: wardAgg });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
