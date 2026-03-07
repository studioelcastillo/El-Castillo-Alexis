import pg from 'pg';
const { Client } = pg;
import fs from 'fs';

const PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'pnnrsqocukixusmzrlhy';
const PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const host = process.env.SUPABASE_DB_HOST || 'aws-1-us-east-1.pooler.supabase.com';
const port = Number(process.env.SUPABASE_DB_PORT || 6543);
const connectionString = process.env.SUPABASE_DB_CONNECTION ||
  (PASSWORD ? `postgresql://postgres.${PROJECT_ID}:${encodeURIComponent(PASSWORD)}@${host}:${port}/postgres` : '');

if (!connectionString) {
  console.error('Missing SUPABASE_DB_CONNECTION or SUPABASE_DB_PASSWORD.');
  process.exit(1);
}

const file = 'supabase/full_init_cleaned.sql';

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    console.log(`Connecting to ${PROJECT_ID}...`);
    await client.connect();
    console.log('Connected successfully. Executing SQL...');

    const sql = fs.readFileSync(file, 'utf8');
    await client.query(sql);
    console.log('SUCCESS: Database initialized.');
  } catch (err) {
    console.error('Error during SQL execution:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
