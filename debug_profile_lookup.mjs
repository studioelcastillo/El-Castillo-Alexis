
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseAnonKey = '';

for (let line of envFile.split('\n')) {
  line = line.trim();
  if (line.startsWith('SUPABASE_URL')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_ANON_KEY')) supabaseAnonKey = line.split('=')[1].trim();
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Checking Supabase connection and profile lookup as 'anon'...");
  
  // This is a dummy test - in a real scenario we'd need an auth token
  // but we can at least see if the query fails with a specific error 
  // vs just returning nothing.
  
  const { data, error } = await supabase
    .from('users')
    .select('*, profiles(*)')
    .limit(1);

  if (error) {
    console.error("❌ Profile lookup failed:", error);
  } else {
    console.log("✅ Profile lookup successful (found someone or empty list):", data);
  }
  
  // Try to check specifically for the profiles table existence
  const { data: profData, error: profError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
    
  if (profError) {
    console.error("❌ Profiles table check failed:", profError);
  } else {
    console.log("✅ Profiles table check successful:", profData);
  }
}

check();
