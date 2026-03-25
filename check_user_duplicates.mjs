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
  console.log("--- Duplicate / Malformed Ident Check ---");

  const { data: results, error } = await supabase.rpc('get_duplicate_identifiers');

  if (error) {
     // If RPC doesn't exist, do it manually
     console.log("Manual check...");
     const { data: allUsers } = await supabase.from('users').select('user_identification');
     const counts = {};
     allUsers.forEach(u => {
        const id = String(u.user_identification).trim();
        counts[id] = (counts[id] || 0) + 1;
     });

     const duplicates = Object.entries(counts).filter(([id, count]) => count > 1);
     console.log("Found", duplicates.length, "duplicate identifiers.");
     if (duplicates.length > 0) {
        console.log("Samples:", duplicates.slice(0, 5));
     }

     const withSpaces = allUsers.filter(u => u.user_identification && (u.user_identification.startsWith(' ') || u.user_identification.endsWith(' ')));
     console.log("Found", withSpaces.length, "identifiers with spaces.");
  }
}

run();
