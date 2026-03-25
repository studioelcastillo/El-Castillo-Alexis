import pg from 'pg';
import { loadSupabaseProject } from './scripts/load-supabase-env.mjs';
const { Client } = pg;

const project = loadSupabaseProject('staging');
const PROJECT_ID = project.ref;
const host = 'aws-1-us-east-1.pooler.supabase.com';
const ports = [6543, 5432];
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error('❌ Error: SUPABASE_DB_PASSWORD no configurada en el entorno.');
  process.exit(1);
}

async function test() {
  for (const port of ports) {
    console.log(`Testing STAGING port ${port}...`);
    const client = new Client({
      user: `postgres.${PROJECT_ID}`,
      host: host,
      database: 'postgres',
      password: password,
      port,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });

    try {
      await client.connect();
      console.log(`✅ SUCCESS on port ${port}!`);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`❌ Failed port ${port}: ${err.message}`);
    }
  }
}

test();
