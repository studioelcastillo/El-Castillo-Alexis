import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

for (let line of envFile.split('\n')) {
  line = line.trim();
  if (line.startsWith('SUPABASE_URL')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY')) supabaseKey = line.split('=')[1].trim();
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'users' });
  // If RPC doesn't exist, we'll try a raw query
  if (error) {
    const { data: rawData, error: rawError } = await supabase.from('pg_policies').select('*').eq('tablename', 'users');
    if (rawError) {
      // Generic query for policies
      const { data: pData, error: pError } = await supabase.rpc('execute_sql', { 
        sql_query: "SELECT * FROM pg_policies WHERE tablename = 'users';" 
      });
      if (pError) {
          // Try another way...
          console.error("Could not fetch policies via RPC. Trying direct query...");
          const { data: finalData, error: finalError } = await supabase.query("SELECT * FROM pg_policies WHERE tablename = 'users';");
          console.log(finalData || finalError);
      } else {
          console.log(pData);
      }
    } else {
      console.log(rawData);
    }
  } else {
    console.log(data);
  }
}

// Since I don't know if get_policies exists, I'll use the query tool if available or just a script with pg
checkRLS();
