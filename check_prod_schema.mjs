import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('production');

async function checkSchema() {
  console.log("Checking PRODUCTION 'terceros' schema...");
  const { data, error } = await supabase.from('terceros').select('*').limit(1);
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Columns found:", Object.keys(data[0] || {}));
  }
}

checkSchema();
