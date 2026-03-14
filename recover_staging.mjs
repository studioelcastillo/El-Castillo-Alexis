import pg from 'pg';
const { Client } = pg;

const PROJECT_ID = 'pnnrsqocukixusmzrlhy';
const host = 'aws-1-us-east-1.pooler.supabase.com';
const port = 6543;

const passwords = [
  'rootroot',
  'CastilloRebuild2026!',
  'Alexis1144063158',
  'root',
  'postgres',
  'Alexis1144063158!',
  'Alexis1144063158.',
  '#Alexis1144063158',
  'root #Alexis1144063158',
  'AlexisCastillo',
  'AlexisCastillo2026!',
  'pnnrsqocukixusmzrlhy',
  process.env.STAGING_PASSWORD_CANDIDATE || ''
].filter(Boolean);

async function test() {
  for (const password of passwords) {
    const connectionString = `postgresql://postgres.${PROJECT_ID}:${encodeURIComponent(password)}@${host}:${port}/postgres`;
    const client = new Client({
      connectionString,
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
  console.log('No working password found.');
}

test();
