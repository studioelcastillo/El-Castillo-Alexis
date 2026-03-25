import pg from 'pg';
const { Client } = pg;

const host = 'db.pnnrsqocukixusmzrlhy.supabase.co';
const port = 5432;

const passwords = [
  'Alexis1144063158!',
  'Alexis1144063158.',
  'AlexisCastillo',
  'AlexisCastillo2026!',
  '*Alexis12',
  '*Alexis1144063158',
  'root #Alexis1144063158',
  'Alexis1144063158',
  '#Alexis1144063158',
  'rootroot',
  'CastilloRebuild2026!',
  'root',
  'postgres',
  'pnnrsqocukixusmzrlhy',
  'Alexis1144063158#',
  'Alexis12',
  'root#Alexis1144063158',
  'root#Alexis12',
  'CastilloRebuild2026',
  '*Alexis1144063158!',
  '*Alexis1144063158#',
  '*Alexis1144063158.'
];

async function test() {
  for (const password of passwords) {
    console.log(`Testing DIRECT Staging with password candidate: ${password.substring(0, 5)}...`);
    const client = new Client({
      user: 'postgres',
      host: host,
      database: 'postgres',
      password: password,
      port,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      console.log(`✅ SUCCESS with password: ${password}`);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
    }
  }
  console.log('No working password found for DIRECT Staging.');
}

test();
