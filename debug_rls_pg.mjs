import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

for (let line of envFile.split('\n')) {
  line = line.trim();
  if (line.startsWith('SUPABASE_URL')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY')) supabaseKey = line.split('=')[1].trim();
}

const PROJECT_ID = supabaseUrl.split('.')[0].split('//')[1];
const PASSWORD = process.env.SUPABASE_DB_PASSWORD || 'your-db-password'; // I might need the password

// Actually, I can use the connection string if present in .env
// Looking at .env, I only see URL and KEY.

// Wait, I have run_pg.mjs. Let's see how it gets the connection.
// It uses SUPABASE_DB_CONNECTION.

async function check() {
  const connectionString = process.env.SUPABASE_DB_CONNECTION;
  if (!connectionString) {
      console.error("SUPABASE_DB_CONNECTION not set in environment.");
      return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query("SELECT * FROM pg_policies WHERE tablename = 'users';");
    console.log("Policies for 'users':", JSON.stringify(res.rows, null, 2));
    
    const rlsStatus = await client.query("SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'users';");
    console.log("RLS Status:", rlsStatus.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

check();
