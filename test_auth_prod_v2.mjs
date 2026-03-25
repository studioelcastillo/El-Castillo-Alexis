import { createSupabaseAnonClient } from './scripts/load-supabase-env.mjs';

const email = process.env.TEST_USER_EMAIL || 'gerencia1elcastillo@gmail.com';
const password = process.env.TEST_USER_PASSWORD;

if (!password) {
  console.error('❌ Error: TEST_USER_PASSWORD no configurada en el entorno.');
  process.exit(1);
}

const supabase = createSupabaseAnonClient('production');

async function testAuth() {
  console.log(`Probando Auth en PRODUCCIÓN para ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Error de Auth:', error.message);
  } else {
    console.log('✅ ÉXITO: Login correcto en Producción');
    console.log('User ID:', data.user.id);
  }
}

testAuth();
