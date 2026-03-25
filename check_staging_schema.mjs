import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('staging');

async function checkStaging() {
  console.log("Checking STAGING 'terceros' schema...");
  const { data, error } = await supabase.from('terceros').select('*').limit(1);
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Columns found:", Object.keys(data[0] || {}));
  }
}

checkStaging();
