import 'dotenv/config';
import { supabase } from '../../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Check env vars first
  const missing = [];
  if (!process.env.SUPABASE_URL)              missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.JWT_SECRET)                missing.push('JWT_SECRET');
  if (!process.env.ADMIN_USERNAME)            missing.push('ADMIN_USERNAME');
  if (!process.env.ADMIN_PASSWORD_HASH)       missing.push('ADMIN_PASSWORD_HASH');

  if (missing.length) {
    return res.status(500).json({
      ok: false,
      error: 'Missing environment variables',
      missing,
    });
  }

  // Try a simple DB query
  try {
    const { data, error, count } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return res.status(500).json({
        ok: false,
        error: 'DB query failed',
        details: error.message,
        hint: error.hint || null,
        code: error.code || null,
      });
    }

    // Also fetch column names to confirm schema
    const { data: sample } = await supabase
      .from('complaints')
      .select('*')
      .limit(1);

    return res.status(200).json({
      ok: true,
      supabase_url: process.env.SUPABASE_URL,
      row_count: count,
      columns: sample && sample[0] ? Object.keys(sample[0]) : '(no rows yet)',
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
