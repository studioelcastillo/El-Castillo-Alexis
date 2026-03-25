import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('production');

async function checkInactive() {
  console.log("--- Checking for potentially problematic user states ---");
  
  const { data: inactive, error: inError } = await supabase
    .from('users')
    .select('user_email, user_active, auth_user_id')
    .eq('user_active', false)
    .limit(10);

  if (inError) {
    console.error("Error checking inactive:", inError.message);
  } else {
    console.log("Inactive users found:", inactive.length);
  }

  const { data: noAuth, error: noAuthError } = await supabase
    .from('users')
    .select('user_email, user_active, auth_user_id')
    .is('auth_user_id', null)
    .eq('user_active', true)
    .limit(10);

  if (noAuthError) {
    console.error("Error checking no auth:", noAuthError.message);
  } else {
    console.log("Active users with NO Auth ID:", noAuth.length);
  }
}

checkInactive();
