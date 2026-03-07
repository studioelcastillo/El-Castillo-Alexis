import pg from 'pg';
const { Client } = pg;

const PROJECT_ID = process.env.SUPABASE_PROJECT_ID;
const PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const host = process.env.SUPABASE_DB_HOST || 'aws-1-us-east-1.pooler.supabase.com';
const port = Number(process.env.SUPABASE_DB_PORT || 6543);

if (!PROJECT_ID || !PASSWORD) {
  console.error('Missing SUPABASE_PROJECT_ID or SUPABASE_DB_PASSWORD.');
  process.exit(1);
}

async function test() {
  const client = new Client({
    user: `postgres.${PROJECT_ID}`,
    host: host,
    database: 'postgres',
    password: PASSWORD,
    port,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`Testing connection to ${PROJECT_ID}...`);
    await client.connect();
    console.log('✅ Connection successful!');
    const res = await client.query('SELECT now()');
    console.log('Server time:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await client.end();
  }
}

test();
