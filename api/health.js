const { createClient } = require('@supabase/supabase-js');

/**
 * GET /api/health
 * Self-test endpoint — checks all env vars and DB connection.
 * Visit this URL after every deploy to confirm everything works.
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const checks = {
    env: {},
    db:  null,
    ok:  false,
  };

  // 1. Check env vars
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH', 'JWT_SECRET'];
  let envOk = true;
  for (const key of required) {
    const present = !!process.env[key];
    checks.env[key] = present ? '✅ set' : '❌ MISSING';
    if (!present) envOk = false;
  }

  if (!envOk) {
    checks.db  = '⏭ skipped (env vars missing)';
    checks.ok  = false;
    checks.action = 'Go to Vercel → Settings → Environment Variables and add the missing variables, then Redeploy.';
    return res.status(200).json(checks);
  }

  // 2. Test Supabase connection
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase.from('complaints').select('count').limit(1);
    if (error) {
      checks.db  = '❌ DB error: ' + error.message;
      checks.ok  = false;
      checks.action = 'Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct.';
    } else {
      checks.db  = '✅ connected';
      checks.ok  = true;
      checks.action = '🎉 Everything is working! Complaints and admin dashboard will work correctly.';
    }
  } catch (e) {
    checks.db  = '❌ exception: ' + e.message;
    checks.ok  = false;
    checks.action = 'Check your Supabase credentials.';
  }

  return res.status(200).json(checks);
};
