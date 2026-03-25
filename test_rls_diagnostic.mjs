import { createSupabaseAnonClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAnonClient('staging');

async function testFetch() {
  console.log("Testing user fetch with ANON KEY (simulating unauthenticated/initial login)...");
  
  // Try to fetch from profiles
  console.log("\nTesting profiles fetch with ANON KEY...");
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (profError) {
    console.log("❌ Error fetching profiles:", profError.message);
  } else {
    console.log("✅ Successfully fetched profiles:", profiles);
  }
}

testFetch();
