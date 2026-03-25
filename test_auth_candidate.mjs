import { createSupabaseAnonClient } from './scripts/load-supabase-env.mjs';

const email = process.env.TEST_USER_EMAIL || 'gerencia1elcastillo@gmail.com';
const password = process.env.TEST_USER_PASSWORD;

if (!password) {
  console.error('❌ Error: TEST_USER_PASSWORD no configurada en el entorno.');
  process.exit(1);
}

const supabase = createSupabaseAnonClient('staging');

async function testAuth() {
  console.log(`Testing login for ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.log(`❌ Login error: ${error.message}`);
  } else {
    console.log(`✅ Login SUCCESS! User ID: ${data.user.id}`);
  }
}

testAuth();
