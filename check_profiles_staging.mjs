import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('staging');

async function checkData() {
  console.log("Checking profiles data with SERVICE ROLE KEY...");
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.log("❌ Error:", error.message);
  } else {
    console.log("✅ Profiles found:", data.length);
    console.log("Sample:", data.slice(0, 2));
  }
}

checkData();
