import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return res.status(503).json({ error: 'Database not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables.' });
  }

  const supabase = createClient(url, key);

  try {
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('status, ward_number, category');

    if (error) throw error;

    let total = 0, pending = 0, underReview = 0, assigned = 0, inProgress = 0, resolved = 0;
    const wardMap = {};

    for (const c of complaints) {
      total++;
      if (c.status === 'Submitted')    pending++;
      else if (c.status === 'Under Review') underReview++;
      else if (c.status === 'Assigned')     assigned++;
      else if (c.status === 'In Progress')  inProgress++;
      else if (c.status === 'Resolved')     resolved++;

      const w = c.ward_number || 'Unknown';
      if (!wardMap[w]) wardMap[w] = { _id: w, count: 0, topCategory: c.category };
      wardMap[w].count++;
    }

    const wardAgg = Object.values(wardMap).sort((a, b) => b.count - a.count);
    return res.status(200).json({ total, pending, underReview, assigned, inProgress, resolved, wards: wardAgg });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
