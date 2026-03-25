import pg from 'pg';
const { Client } = pg;

const PROJECT_ID = 'pnnrsqocukixusmzrlhy'; // Staging
const host = 'aws-1-us-east-1.pooler.supabase.com';
const port = 6543;

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
  '*Alexis1144063158.',
  'Stud10C200',
  'ElCastilloST2022'
];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function test() {
  for (const password of passwords) {
    for (const p of [6543, 5432]) {
      let attempts = 0;
      let connected = false;

      while (attempts < 3 && !connected) {
        const client = new Client({
          user: `postgres.${PROJECT_ID}`,
          host: host,
          database: 'postgres',
          password: password,
          port: p,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000
        });

        try {
          console.log(`Testing Staging on port ${p} with password: ${password.substring(0, 5)}... (Attempt ${attempts + 1})`);
          await client.connect();
          console.log(`✅ SUCCESS with password: ${password} on port ${p}`);
          await client.end();
          process.exit(0);
        } catch (err) {
          console.log(`❌ Failed port ${p}: ${err.message}`);
          if (err.message.includes('Circuit breaker open')) {
            console.log('Circuit breaker open, waiting 10 seconds...');
            await wait(10000);
            attempts++;
          } else {
            break; // Other error, try next candidate
          }
        }
      }
      await wait(2000); // Successive attempts delay
    }
  }
  console.log('No working password found for Staging.');
}

test();
