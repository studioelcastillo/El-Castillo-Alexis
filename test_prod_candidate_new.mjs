import pg from 'pg';
import { loadSupabaseProject } from './scripts/load-supabase-env.mjs';
const { Client } = pg;

const project = loadSupabaseProject('production');
const PROJECT_ID = project.ref;
const host = 'aws-0-us-east-1.pooler.supabase.com';
const port = 6543;
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error('❌ Error: SUPABASE_DB_PASSWORD no configurada en el entorno.');
  process.exit(1);
}

async function test() {
  const connectionString = `postgresql://postgres.${PROJECT_ID}:${encodeURIComponent(password)}@${host}:${port}/postgres`;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    console.log(`Testing password candidate for Production...`);
    await client.connect();
    console.log(`✅ SUCCESS: The database password for Production is valid.`);
    await client.end();
  } catch (err) {
    console.log(`❌ Failed: ${err.message}`);
  }
}

test();
