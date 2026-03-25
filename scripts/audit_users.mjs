import { createSupabaseAdminClient } from './load-supabase-env.mjs';

async function auditUsers(env) {
  console.log(`--- Auditing users in ${env} ---`);
  const supabase = createSupabaseAdminClient(env);

  // Check for NULL auth_user_id
  const { data: noAuth, error: errorNoAuth } = await supabase
    .from('users')
    .select('user_id, user_email, user_name')
    .is('auth_user_id', null);

  if (errorNoAuth) {
    console.error(`Error checking NULL auth_user_id:`, errorNoAuth);
  } else {
    console.log(`Users with NULL auth_user_id: ${noAuth.length}`);
    if (noAuth.length > 0) {
      console.log(noAuth.slice(0, 5));
    }
  }

  // Check for NULL std_id
  const { data: noStd, error: errorNoStd } = await supabase
    .from('users')
    .select('user_id, user_email, user_name')
    .is('std_id', null);

  if (errorNoStd) {
    console.error(`Error checking NULL std_id:`, errorNoStd);
  } else {
    console.log(`Users with NULL std_id: ${noStd.length}`);
    if (noStd.length > 0) {
      console.log(noStd.slice(0, 5));
    }
  }

  // Check for duplicated emails in public.users
  const { data: allUsers, error: errorAll } = await supabase
    .from('users')
    .select('user_email');
  
  if (allUsers) {
    const emails = allUsers.map(u => u.user_email?.toLowerCase()).filter(Boolean);
    const duplicates = emails.filter((item, index) => emails.indexOf(item) !== index);
    const uniqueDuplicates = [...new Set(duplicates)];
    console.log(`Duplicated emails in public.users: ${uniqueDuplicates.length}`);
    if (uniqueDuplicates.length > 0) {
       console.log(uniqueDuplicates.slice(0, 10));
    }
  }
}

async function main() {
  try {
    await auditUsers('staging');
    // await auditUsers('production'); // Uncomment if needed and safe
  } catch (e) {
    console.error(e);
  }
}

main();
