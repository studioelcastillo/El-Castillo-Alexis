import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let envFile;
try {
  envFile = fs.readFileSync('.env', 'utf8');
} catch (e) {
  console.error("No .env found.");
  process.exit(1);
}

let supabaseUrl = '';
let supabaseKey = '';

for (let line of envFile.split('\n')) {
  line = line.trim();
  if (line.startsWith('SUPABASE_URL')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY')) supabaseKey = line.split('=')[1].trim();
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- Fixing RLS for User Lookup (Anon) ---");

  const sql = `
    -- Enable RLS on users if not already enabled
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;

    -- Drop existing policy if it exists to avoid errors on duplicate
    DROP POLICY IF EXISTS "Allow anon read for login lookup" ON users;

    -- Create policy to allow anonymous users to search by identification or email
    CREATE POLICY "Allow anon read for login lookup" ON users
    FOR SELECT
    USING (
      (auth.role() = 'anon') OR (auth.role() = 'authenticated')
    );
  `;

  console.log("Executing SQL to enable RLS and add public policy...");
  // Use a hacky way since pg might not work: use a specific RPC or just try a direct REST call if there's no SQL RPC
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.log("RPC 'exec_sql' not found. You need to run this manually in Supabase SQL Editor:");
    console.log(sql);
  } else {
    console.log("RLS Fix applied successfully!");
  }
}

run();
