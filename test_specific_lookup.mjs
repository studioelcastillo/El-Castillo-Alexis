import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let envFile = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

for (let line of envFile.split('\n')) {
  line = line.trim();
  if (line.startsWith('SUPABASE_URL')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY')) supabaseKey = line.split('=')[1].trim();
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test(identifier) {
    console.log(`Testing identifier: ${identifier}`);
    const { data: results, error } = await supabase
      .from("users")
      .select("user_email, user_identification, auth_user_id, user_active, user_name")
      .is("deleted_at", null)
      .or(`user_identification.eq.${identifier},user_name.ilike."${identifier}"`); // Added quotes for ilike safety

    if (error) {
        console.error("Error with quotes:", error);
    } else {
        console.log("Results with quotes:", results);
    }

    const { data: results2, error: error2 } = await supabase
      .from("users")
      .select("user_email, user_identification, auth_user_id, user_active, user_name")
      .is("deleted_at", null)
      .or(`user_identification.eq.${identifier},user_name.ilike.${identifier}`);

    if (error2) {
        console.error("Error without quotes:", error2);
    } else {
        console.log("Results without quotes:", results2);
    }

    // Try finding by identification specifically
    const { data: direct } = await supabase.from('users').select('*').eq('user_identification', identifier);
    console.log("Direct identification match:", direct);
}

test('1144063158');
