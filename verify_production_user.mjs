import { authAdminGetUserById, createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('production');

async function check() {
  const doc = "1144063158"; // Same as staging test user
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
      const authUser = await authAdminGetUserById('production', user.auth_user_id);
      console.log('Auth user exists:', authUser.user?.email || '(sin email)');
    } catch (error) {
      console.error('Auth user not found in auth.users:', error instanceof Error ? error.message : String(error));
    }

    // Try to login manually with 5 digits
    const pass5 = doc.slice(-5);
    console.log(`Testing login for ${user.user_email} with 5-digit password ${pass5}...`);
    const { error: error5 } = await supabase.auth.signInWithPassword({
      email: user.user_email,
      password: pass5
    });

    if (error5) {
      console.error("❌ 5-digit login FAILED:", error5.message);
    } else {
      console.log("✅ 5-digit login SUCCESSFUL");
    }

    // Try with 6 digits
    const pass6 = doc.slice(-6);
    console.log(`Testing login for ${user.user_email} with 6-digit password ${pass6}...`);
    const { error: error6 } = await supabase.auth.signInWithPassword({
      email: user.user_email,
      password: pass6
    });

    if (error6) {
      console.error("❌ 6-digit login FAILED:", error6.message);
    } else {
      console.log("✅ 6-digit login SUCCESSFUL");
    }
  }
}

check();
