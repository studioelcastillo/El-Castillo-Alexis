import fs from 'node:fs';
import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('production');

async function checkData() {
  const result = {};
  
  try {
    const { data: policies, error: polError } = await supabase
      .from('data_policies')
      .select('*');
    result.policies = policies;
    result.polError = polError?.message;

    const { data: users, error: userError } = await supabase
      .from('users')
      .select('user_id, user_email, auth_user_id')
      .eq('user_id', 3734) // Sample user from previous check
      .single();
    result.sampleUser = users;
    result.userError = userError?.message;

  } catch (e) {
    result.exception = e.message;
  }

  fs.writeFileSync('db_check_result.json', JSON.stringify(result, null, 2));
  console.log("Check complete. Result saved to db_check_result.json");
}

checkData();
