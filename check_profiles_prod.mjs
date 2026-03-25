import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('production');

async function checkProfiles() {
  console.log("--- Checking PROFILES table ---");
  
  // Try to list tables or just query 'profiles'
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);

  if (profError) {
    console.log("Profiles table might not exist or is empty. Error:", profError.message);
  } else {
    console.log("Profiles found:", profiles.length);
  }

  // Check if session sync would fail if profiles is missing
  const { data: userTest, error: userError } = await supabase
    .from('users')
    .select('*, profiles(*)')
    .limit(1);

  if (userError) {
    console.error("Join user + profiles FAILED:", userError.message);
  } else {
    console.log("Join successful:", userTest);
  }
}

checkProfiles();
