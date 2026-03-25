import { createSupabaseAdminClient } from './load-supabase-env.mjs';

async function inspectSchema(env) {
  const supabase = createSupabaseAdminClient(env);
  
  console.log(`--- Inspecting schema for ${env} ---`);
  
  // Try to get one row
  const { data, error } = await supabase.from('users').select('*').limit(1);
  
  if (error) {
    console.error('Error fetching user:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Columns in users table:', Object.keys(data[0]));
  } else {
    console.log('No users found in table.');
  }

  // Also check auth metadata
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error fetching auth users:', authError);
  } else {
    console.log('Auth user sample metadata:', authUsers.users[0]?.user_metadata);
  }
}

inspectSchema('staging');
