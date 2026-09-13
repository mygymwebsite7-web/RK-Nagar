/**
 * Run this ONCE locally: node setup-env.cjs
 * It generates a bcrypt hash for your admin password and writes .env
 */
const bcrypt = require('bcryptjs');
const fs     = require('fs');
const path   = require('path');

const ADMIN_PASSWORD = 'tvk@admin2024';   // ← change this to your desired password
const ADMIN_USERNAME = 'tvkadmin';
const JWT_SECRET     = 'tvk-rknagar-super-secret-jwt-2024-xK9mP3qL';

// You MUST fill these from your Supabase project dashboard:
// Project → Settings → API
const SUPABASE_URL              = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE';

async function main() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const env = [
    `SUPABASE_URL=${SUPABASE_URL}`,
    `SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}`,
    `ADMIN_USERNAME=${ADMIN_USERNAME}`,
    `ADMIN_PASSWORD_HASH=${hash}`,
    `JWT_SECRET=${JWT_SECRET}`,
  ].join('\n');

  fs.writeFileSync(path.join(__dirname, '.env'), env);

  console.log('✅ .env file created!');
  console.log('');
  console.log('Admin password hash:', hash);
  console.log('');
  console.log('Now add these in Vercel → Settings → Environment Variables:');
  console.log('');
  console.log(env);
  console.log('');
  console.log('Then redeploy on Vercel.');
}

main().catch(console.error);
