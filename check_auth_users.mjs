import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

async function checkAuthUsers() {
  const supabase = createSupabaseAdminClient('staging');
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Error listing users:', error.message);
    process.exit(1);
  }
  
  const user = users.find(u => u.email === 'marianaprueba@gmail.com');
  if (user) {
    console.log(`✅ User found: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Metadata:`, JSON.stringify(user.user_metadata, null, 2));
  } else {
    console.log(`❌ User NOT found: marianaprueba@gmail.com`);
  }
}

checkAuthUsers();
