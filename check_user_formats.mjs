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
  console.log("--- User Login Format Check ---");

  const { data: samples, error } = await supabase
    .from('users')
    .select('user_id, user_name, user_email, user_identification, auth_user_id')
    .limit(10);

  if (error) console.error(error);
  else {
    samples.forEach(u => {
      console.log(`ID: ${u.user_id} | Name: ${u.user_name} | Ident: ${u.user_identification} | Email: ${u.user_email} | AuthID: ${u.auth_user_id}`);
    });
  }
}

run();
