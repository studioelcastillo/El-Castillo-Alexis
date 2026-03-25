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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- Admin & Auth Check ---");

  // 1. Find admins
  const { data: admins, error: err1 } = await supabase
    .from('users')
    .select('user_id, user_name, user_email, auth_user_id, prof_id')
    .eq('prof_id', 1);

  if (err1) console.error("Error admins:", err1);
  else {
    console.log(`Found ${admins.length} Admins:`);
    admins.forEach(a => {
      console.log(`ID: ${a.user_id} | Name: ${a.user_name} | Email: ${a.user_email} | AuthID: ${a.auth_user_id}`);
    });
  }

  // 2. Check studios
  const { count: studioCount } = await supabase.from('studios').select('*', { count: 'exact', head: true });
  console.log("\nTotal Studios:", studioCount);

  // 3. Check studios_models
  const { count: smCount } = await supabase.from('studios_models').select('*', { count: 'exact', head: true });
  console.log("Total Studio-Model assignments:", smCount);

  // 4. Test query for first admin
  if (admins && admins.length > 0) {
    const admin = admins[0];
    console.log(`\nSimulating Datatable filter for Admin: ${admin.user_name}`);

    const { data: results, error: err2 } = await supabase
        .from('users')
        .select(`
            user_id,
            user_name,
            user_active,
            studios_models (
                std_id,
                studios (std_name)
            )
        `)
        .eq('user_active', true)
        .is('deleted_at', null)
        .limit(5);

    if (err2) console.error("Filter error:", err2);
    else {
      console.log(`Found ${results.length} active users.`);
    }
  }
}

run();
