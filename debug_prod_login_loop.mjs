import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('production');

async function inspectRLS() {
  console.log("--- Inspecting RLS Policies in PRODUCTION ---");
  
  // Try to see what policies are defined on 'users'
  const { data: policies, error: polError } = await supabase
    .from('pg_policies') // This might not work via REST API
    .select('*')
    .eq('tablename', 'users');

  if (polError) {
    console.log("Cannot query pg_policies directly via REST. Trying to test access instead.");
  } else {
    console.log("Policies:", policies);
  }

  // Check if we have users with auth_user_id
  const { data: userWithAuth, error: userError } = await supabase
    .from('users')
    .select('user_id, auth_user_id, user_email')
    .not('auth_user_id', 'is', null)
    .limit(5);

  if (userError) {
    console.error("Error fetching users:", userError.message);
  } else {
    console.log("Found users with Auth ID:", userWithAuth);
  }

  // Test if an authenticated user (simulated) can see themselves
  if (userWithAuth && userWithAuth.length > 0) {
    const testUser = userWithAuth[0];
    console.log(`\nTesting if user ${testUser.user_email} can see their own data...`);
    
    // We can't easily "become" the user without their JWT, 
    // but we can check the policy logic if we had access to SQL.
  }
}

inspectRLS();
