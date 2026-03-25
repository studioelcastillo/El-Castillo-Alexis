import { createSupabaseAnonClient } from './scripts/load-supabase-env.mjs';

const identifier = String(process.env.TEST_IDENTIFIER || '').trim();
const email = String(process.env.TEST_USER_EMAIL || (identifier ? `${identifier}@legacy.elcastillo.local` : '')).trim();
const password = String(process.env.TEST_USER_PASSWORD || (identifier ? identifier.slice(-6) : '')).trim();

async function test(target, label) {
  console.log(`--- Testing ${label} ---`);
  const supabase = createSupabaseAnonClient(target);

  if (!identifier || !email || !password) {
    console.error('Define TEST_IDENTIFIER y, si hace falta, TEST_USER_EMAIL/TEST_USER_PASSWORD antes de ejecutar este script.');
    return;
  }
  
  // Try lookup
  const { data: users, error: lookupErr } = await supabase.from('users').select('user_email').eq('user_identification', identifier);
  if (lookupErr) console.log(`${label} lookup error:`, lookupErr.message);
  else console.log(`${label} lookup result:`, users);

  console.log(`Testing login for ${email} / ${password}...`);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) console.log(`${label} login error:`, error.message);
  else console.log(`${label} login SUCCESS!`);
}

async function run() {
  await test('staging', 'STAGING');
  await test('production', 'PRODUCTION');
}

run();
