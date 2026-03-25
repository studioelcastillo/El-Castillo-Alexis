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

async function findOthers() {
  const { data: users, error } = await supabase
    .from('users')
    .select('user_id, user_identification, user_password, auth_user_id')
    .not('user_identification', 'is', null)
    .not('user_password', 'is', null);

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  for (const user of users) {
    const ident = String(user.user_identification).trim();
    const pass = String(user.user_password).trim();
    
    if (ident.length < 6 || pass !== ident.slice(-6)) {
      if (ident.length >= 5 && pass === ident.slice(-5)) {
          // ignore 5 digit if we only want 6
      } else {
          console.log("Found anomaly:", user);
      }
    }
  }
}

findOthers();
