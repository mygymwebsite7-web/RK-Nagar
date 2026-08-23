import 'dotenv/config';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const missing = [];
  if (!process.env.SUPABASE_URL)              missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.JWT_SECRET)                missing.push('JWT_SECRET');
  if (!process.env.ADMIN_USERNAME)            missing.push('ADMIN_USERNAME');
  if (!process.env.ADMIN_PASSWORD_HASH)       missing.push('ADMIN_PASSWORD_HASH');

  if (missing.length) {
    return res.status(200).json({
      ok: false,
      problem: 'Missing environment variables — add in Vercel → Settings → Environment Variables',
      missing,
    });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: sample, error: readErr } = await supabase
    .from('complaints').select('*').limit(1);

  if (readErr) {
    return res.status(200).json({
      ok: false, problem: 'DB read failed', error: readErr.message, code: readErr.code,
    });
  }

  const testId = 'DEBUG-' + Date.now();
  const { error: insertErr } = await supabase.from('complaints').insert([{
    complaint_id: testId,
    name: 'Debug', mobile: '0000000000', ward_number: '0',
    area: 'Debug', category: 'Other Local Problems',
    description: 'debug', landmark: '', photo: '',
  }]);
  if (!insertErr) {
    await supabase.from('complaints').delete().eq('complaint_id', testId);
  }

  return res.status(200).json({
    ok: !insertErr,
    db_columns: sample && sample[0] ? Object.keys(sample[0]) : '(empty table — columns ok)',
    insert_test: insertErr
      ? { ok: false, error: insertErr.message }
      : { ok: true, message: 'All systems working' },
  });
}
