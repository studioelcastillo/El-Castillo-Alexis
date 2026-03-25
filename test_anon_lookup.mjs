import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let envFile = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let anonKey = '';

for (let line of envFile.split('\n')) {
  line = line.trim();
  if (line.startsWith('SUPABASE_URL')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_ANON_KEY')) anonKey = line.split('=')[1].trim();
}

const supabase = createClient(supabaseUrl, anonKey);

async function test(identifier) {
    console.log(`Testing identifier with ANON KEY: ${identifier}`);
    const { data: results, error } = await supabase
      .from("users")
      .select("user_email, user_identification, auth_user_id, user_active, user_name")
      .is("deleted_at", null)
      .or(`user_identification.eq.${identifier},user_name.ilike.${identifier}`);

    if (error) {
        console.error("Lookup Error (Anon):", error);
    } else {
        console.log("Results (Anon):", results);
        if (results && results.length === 0) {
            console.log("No users found with Anon Key. RLS might be blocking this.");
        }
    }
}

test('1144063158');
