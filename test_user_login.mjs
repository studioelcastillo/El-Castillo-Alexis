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
let supabaseAnonKey = '';
let supabaseServiceKey = '';

for (let line of envFile.split('\n')) {
  line = line.trim();
  if (line.startsWith('SUPABASE_URL')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_ANON_KEY')) supabaseAnonKey = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY')) supabaseServiceKey = line.split('=')[1].trim();
}

const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  // Grab a few recent users that have been updated from the script output:
  // For example: 1047371815 -> 371815, 1143848310 -> 848310, 1107098030 -> 098030
  const docsToTest = ["1047371815", "1143848310", "1107098030"];
  
  for (const doc of docsToTest) {
    const expectedPassword = doc.slice(-6);
    
    // get their email from public.users since Supabase Auth requires email
    const { data: users, error: dbError } = await supabaseService.from('users').select('user_email, user_identification').eq('user_identification', doc).limit(1);
    
    if (dbError) {
      console.error(`DB Error for ${doc}:`, dbError);
      continue;
    }

    if (!users || users.length === 0) {
        console.log(`User ${doc} not found in public.users`);
        continue;
    }
    
    const email = users[0].user_email;
    if (!email) {
        console.log(`User ${doc} has no email`);
        continue;
    }

    console.log(`Testing login for ${doc} (${email}) with password ${expectedPassword}...`);
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: email,
      password: expectedPassword,
    });
    
    if (error) {
      console.error(`❌ Login failed for ${doc}:`, error.message);
    } else {
      console.log(`✅ Login SUCCESS for ${doc}! User ID: ${data.user.id}`);
    }
  }
}
test();
