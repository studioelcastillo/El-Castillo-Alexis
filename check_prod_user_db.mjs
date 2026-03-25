import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('production');

async function check() {
  const { data: user, error } = await supabase
    .from('users')
    .select('user_identification, user_password')
    .eq('user_identification', '1144063158')
    .single();

  if (error) {
    console.error(error);
  } else {
    console.log(user);
  }
}

check();
