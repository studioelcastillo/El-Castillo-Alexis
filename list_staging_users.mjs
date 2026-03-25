import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

async function listUsers() {
  const supabase = createSupabaseAdminClient('staging');
  
  console.log('Fetching users from Staging...');
  const { data, error } = await supabase
    .from('users')
    .select('user_id, user_name, user_email, std_id, user_identification')
    .ilike('user_email', '%gmail.com');
    
  if (error) {
    console.error('❌ Error fetching users:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Found Gmail users:');
  console.table(data);
}

listUsers();
