import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('staging');

async function testRPCs() {
  const candidates = ['exec_sql', 'run_sql', 'execute_sql', 'sql', 'db_query'];
  console.log("Testing potential RPC candidates for SQL execution...");

  for (const rpc of candidates) {
    console.log(`Testing ${rpc}...`);
    try {
      const { data, error } = await supabase.rpc(rpc, { sql: 'SELECT 1' });
      if (error && error.code === 'P0001') { 
          // This usually means the function exists but parameters are wrong
          console.log(`✅ ${rpc} potentially exists (P0001 error).`);
      } else if (!error) {
          console.log(`✅ ${rpc} success! result:`, data);
      } else {
          console.log(`❌ ${rpc} failed: ${error.message} (${error.code})`);
      }
    } catch (e) {
      console.log(`❌ ${rpc} exception: ${e.message}`);
    }
  }
}

testRPCs();
