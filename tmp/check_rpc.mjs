import { createSupabaseAdminClient } from '../scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('staging');

async function checkRpc() {
  console.log("Checking if 'exec_sql' RPC exists on Staging...");
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: 'SELECT 1' 
  });

  if (error) {
    if (error.message.includes('not found') || error.code === 'PGRST202') {
      console.log("❌ 'exec_sql' RPC does NOT exist.");
    } else {
      console.log("❓ RPC failed with different error:", error.message, error.code);
    }
  } else {
    console.log("✅ 'exec_sql' RPC EXISTS and works!");
    console.log("Result:", data);
  }
}

checkRpc();
