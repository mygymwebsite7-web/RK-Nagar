import 'dotenv/config';
import { supabase } from '../../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('status, wardNumber, category');

    if (error) throw error;

    let total = 0, pending = 0, underReview = 0, assigned = 0, inProgress = 0, resolved = 0;
    const wardMap = {};

    for (const c of complaints) {
      total++;
      if (c.status === 'Submitted') pending++;
      else if (c.status === 'Under Review') underReview++;
      else if (c.status === 'Assigned') assigned++;
      else if (c.status === 'In Progress') inProgress++;
      else if (c.status === 'Resolved') resolved++;

      const w = c.wardNumber || c.wardnumber || 'Unknown';
      if (!wardMap[w]) {
        wardMap[w] = { _id: w, count: 0, topCategory: c.category };
      }
      wardMap[w].count++;
    }

    const wardAgg = Object.values(wardMap).sort((a, b) => b.count - a.count);

    return res.status(200).json({ total, pending, underReview, assigned, inProgress, resolved, wards: wardAgg });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
