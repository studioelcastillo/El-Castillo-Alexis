import fs from 'fs';
import { Client } from 'pg';
import path from 'path';

const PROJECT_ID = process.env.SUPABASE_PROJECT_ID;
const PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const host = process.env.SUPABASE_DB_HOST || 'aws-1-us-east-1.pooler.supabase.com';
const port = Number(process.env.SUPABASE_DB_PORT || 6543);
const connectionString = process.env.SUPABASE_DB_CONNECTION ||
  (PROJECT_ID && PASSWORD
    ? `postgresql://postgres.${PROJECT_ID}:${encodeURIComponent(PASSWORD)}@${host}:${port}/postgres`
    : '');

if (!connectionString) {
  console.error('Missing SUPABASE_DB_CONNECTION or SUPABASE_PROJECT_ID + SUPABASE_DB_PASSWORD.');
  process.exit(1);
}

const filesToRun = [
  'supabase/schema.sql',
  'supabase/legacy_schema_missing.sql',
  'supabase/legacy_aws_alignment.sql',
  'supabase/configure_rls.sql',
  'supabase/api_modules_seed.sql',
  'supabase/payroll_setup.sql',
  'supabase/audit.sql',
  'supabase/audit_modules.sql',
  'supabase/storage_setup.sql',
  'supabase/seed_attendance.sql'
];

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully.');

    for (const file of filesToRun) {
      if (!fs.existsSync(file)) {
        console.log(`Skipping ${file} - not found`);
        continue;
      }
      console.log(`Executing ${file}...`);
      const sql = fs.readFileSync(file, 'utf8');

      // We wrap the sql in an anonymous block or just execute it directly.
      // Executing large DDL scripts may require splitting, but client.query usually handles multiple statements.
      await client.query(sql);
      console.log(`SUCCESS: ${file}`);
    }
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
