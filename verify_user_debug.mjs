import { authAdminGetUserById, createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('staging');

async function check() {
  const doc = "1144063158";
  const { data: user, error } = await supabase
    .from('users')
    .select('user_email, auth_user_id, user_active, user_identification')
    .eq('user_identification', doc)
    .single();

  if (error) {
    console.error("User not found in public.users:", error.message);
    return;
  }

  console.log("User in public.users:", user);

  if (user.auth_user_id) {
    try {
      const authUser = await authAdminGetUserById('staging', user.auth_user_id);
      console.log('Auth user exists:', authUser.user?.email || '(sin email)');
    } catch (error) {
      console.error('Auth user not found in auth.users:', error instanceof Error ? error.message : String(error));
    }

    // Try to login manually with the expected password
    const expectedPassword = doc.slice(-6);
    console.log(`Testing login for ${user.user_email} with password ${expectedPassword}...`);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.user_email,
      password: expectedPassword
    });

    if (signInError) {
      console.error("❌ Login test FAILED:", signInError.message);
    } else {
      console.log("✅ Login test SUCCESSFUL");
    }
  }
}

check();
