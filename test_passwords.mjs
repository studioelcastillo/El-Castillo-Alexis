import pg from 'pg';
const { Client } = pg;

const PROJECT_ID = process.env.SUPABASE_PROJECT_ID;
const host = process.env.SUPABASE_DB_HOST || 'aws-1-us-east-1.pooler.supabase.com';
const port = Number(process.env.SUPABASE_DB_PORT || 6543);
const passwords = (process.env.SUPABASE_DB_PASSWORDS || '')
  .split(',')
  .map((password) => password.trim())
  .filter(Boolean);

if (!PROJECT_ID || passwords.length === 0) {
  console.error('Missing SUPABASE_PROJECT_ID or SUPABASE_DB_PASSWORDS (comma-separated).');
  process.exit(1);
}

const maskSecret = (value) => {
  if (!value) return '<empty>';
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
};

async function test() {
  for (const password of passwords) {
    const client = new Client({
      user: `postgres.${PROJECT_ID}`,
      host: host,
      database: 'postgres',
      password: password,
      port,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });

    try {
      console.log(`Testing password candidate: ${maskSecret(password)}...`);
      await client.connect();
      console.log(`✅ SUCCESS with password candidate: ${maskSecret(password)}`);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
    }
  }
  console.log('No working password found.');
}

test();
