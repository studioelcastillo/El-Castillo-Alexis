import { createSupabaseAdminClient } from './load-supabase-env.mjs';

async function run() {
  const supabase = createSupabaseAdminClient('staging');
  const { data, error } = await supabase
    .from('users')
    .select('user_id, user_email, auth_user_id, user_active')
    .in('auth_user_id', [
      'f26380c5-0d08-4392-becb-6b1d8a79e6af',
      'b6d73c11-0190-4df0-bbc5-68ff6e8515a2',
      'd9364779-a6c7-4d89-a1bc-a0fda318386a'
    ]);

  if (error) {
    console.error(error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

run();
