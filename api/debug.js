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
    return res.status(500).json({ ok: false, error: 'Missing environment variables', missing });
  }

  try {
    // Query information_schema to get actual column names in the table
    const { data: cols, error: colErr } = await supabase
      .rpc('get_columns')
      .select('*');

    // Fallback: just fetch one row and report the keys
    const { data: sample, error: sampleErr } = await supabase
      .from('complaints')
      .select('*')
      .limit(1);

    if (sampleErr) {
      return res.status(500).json({
        ok: false,
        error: 'DB query failed',
        details: sampleErr.message,
        hint: sampleErr.hint || null,
        code: sampleErr.code || null,
      });
    }

    // Try inserting a test row to see what error we get
    const testId = 'DEBUG-TEST-' + Date.now();
    const { error: insertErr } = await supabase
      .from('complaints')
      .insert([{
        complaint_id: testId,
        name: 'Debug Test',
        mobile: '0000000000',
        ward_number: '0',
        area: 'Debug',
        category: 'Other Local Problems',
        description: 'Debug test row - safe to delete',
        landmark: '',
        photo: '',
      }]);

    // Immediately delete it
    if (!insertErr) {
      await supabase.from('complaints').delete().eq('complaint_id', testId);
    }

    return res.status(200).json({
      ok: true,
      supabase_url: process.env.SUPABASE_URL,
      existing_columns: sample && sample[0] ? Object.keys(sample[0]) : '(table is empty — cannot detect columns)',
      row_count: sample ? sample.length : 0,
      insert_test: insertErr
        ? { ok: false, error: insertErr.message, hint: insertErr.hint, code: insertErr.code }
        : { ok: true, message: 'Insert + delete succeeded with snake_case columns' },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
