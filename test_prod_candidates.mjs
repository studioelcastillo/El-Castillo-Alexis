import pg from 'pg';
const { Client } = pg;

const PROJECT_ID = 'ysorlqfwqccsgxxkpzdx';
const host = 'aws-1-us-east-1.pooler.supabase.com';
const port = 6543;

const passwords = [
  'Alexis1144063158',
  '#Alexis1144063158',
  'CastilloRebuild2026!',
  'rootroot',
  'root'
];

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
      console.log(`Testing password: ${password.substring(0, 3)}...`);
      await client.connect();
      console.log(`✅ SUCCESS with password: ${password}`);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
    }
  }
}

test();
