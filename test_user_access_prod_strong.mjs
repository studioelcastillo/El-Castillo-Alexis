import { createSupabaseAnonClient } from './scripts/load-supabase-env.mjs';

const email = String(process.env.TEST_USER_EMAIL || '').trim();
const password = String(process.env.TEST_USER_PASSWORD || '').trim();

const supabase = createSupabaseAnonClient('production');

async function testUserAccess() {
  if (!email || !password) {
    console.error('Define TEST_USER_EMAIL y TEST_USER_PASSWORD antes de ejecutar este script.');
    return;
  }

  console.log(`Logging in as ${email} with password ${password}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error("Auth Error:", authError.message);
    return;
  }

  const user = authData.user;
  console.log("Logged in successfully. User ID:", user.id);

  console.log("\nAttempting to fetch own record from 'users' table...");
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id);

  if (userError) {
    console.error("Fetch User Error:", userError.message);
  } else {
    console.log("Found user record(s):", userData.length);
    if (userData.length > 0) {
      console.log("User record found.");
    } else {
      console.log("NO user record found for current auth_user_id (RLS issue confirm?).");
    }
  }

  console.log("\nAttempting to fetch profiles...");
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*');

  if (profileError) {
    console.error("Fetch Profile Error:", profileError.message);
  } else {
    console.log("Found profiles count:", profileData?.length);
  }
}

testUserAccess();
