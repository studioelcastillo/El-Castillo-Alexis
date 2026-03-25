import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('production');

async function getTestUser() {
  const { data, error } = await supabase
    .from('users')
    .select('user_email, user_identification, auth_user_id')
    .not('auth_user_id', 'is', null)
    .limit(1);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Test User:", data[0]);
  }
}

getTestUser();
