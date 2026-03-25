import { createSupabaseAnonClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAnonClient('staging');

async function testAuth() {
  const email = process.env.TEST_USER_EMAIL || 'gerencia1elcastillo@gmail.com';
  const candidateStr = process.env.TEST_PASSWORD_CANDIDATES || '';
  const passwords = candidateStr ? candidateStr.split(',') : [];

  if (passwords.length === 0) {
    console.error('❌ Error: TEST_PASSWORD_CANDIDATES no configurada en el entorno.');
    process.exit(1);
  }

  for (const password of passwords) {
    console.log(`Testing Supabase Auth Login for ${email} with password ${password.substring(0,3)}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(`❌ Auth failed (${password.substring(0,3)}...): ${error.message}`);
    } else {
      console.log(`✅ Auth SUCCESS!`);
      console.log('User ID:', data.user.id);
      process.exit(0);
    }
  }
}

testAuth();
