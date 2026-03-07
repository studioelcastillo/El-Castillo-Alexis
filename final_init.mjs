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

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to Supabase Staging.');

    const sql = fs.readFileSync('supabase/full_init_cleaned.sql', 'utf8');

    console.log('Executing full schema (tables + functions + RLS)...');

    // We'll execute the whole file as one command.
    // This is generally supported by the pg driver and avoids semicolon splitting issues.
    await client.query(sql);

    console.log('✅ SUCCESS: Database Staging fully initialized.');
  } catch (err) {
    console.error('❌ Error during initialization:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
