import pg from 'pg';
const { Client } = pg;

const PROJECT_ID = 'pnnrsqocukixusmzrlhy'; // Staging
const host = 'aws-1-us-east-1.pooler.supabase.com';
const port = 6543;

const passwords = [
  'CastilloRebuild2026!',
  'CastilloRebuild2026',
  'Alexis1144063158!',
  'Alexis1144063158#',
  'root #Alexis1144063158',
  'Alexis1144063158',
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
      console.log(`Testing password candidate for Staging...`);
      await client.connect();
      console.log(`✅ SUCCESS with password: ${password}`);
      const res = await client.query('SELECT now()');
      console.log('Server time:', res.rows[0].now);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
    }
  }
  console.log('No working password found for Staging.');
}

test();
