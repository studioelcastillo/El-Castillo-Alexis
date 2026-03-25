import pg from 'pg';
const { Client } = pg;

const projects = [
  { name: 'staging', id: 'pnnrsqocukixusmzrlhy', host: 'aws-1-us-east-1.pooler.supabase.com' },
  { name: 'production', id: 'ysorlqfwqccsgxxkpzdx', host: 'aws-1-us-east-2.pooler.supabase.com' }
];

const passwords = [
  'root #Alexis1144063158',
  'root#Alexis1144063158',
  '*Alexis1144063158',
  'Alexis1144063158',
  '*Alexis12',
  'Alexis12',
  'root#Alexis12',
  'rootroot',
  'CastilloRebuild2026!'
];

async function test() {
  for (const project of projects) {
    console.log(`\n=== Testing PROJECT: ${project.name} (${project.id}) ===`);
    for (const password of passwords) {
      console.log(`Testing: "${password.substring(0, 7)}..."`);
      const client = new Client({
        user: `postgres.${project.id}`,
        host: project.host,
        database: 'postgres',
        password: password,
        port: 6543,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });

      try {
        await client.connect();
        console.log(`✅ SUCCESS! Project: ${project.name}, Password: ${password}`);
        await client.end();
      } catch (err) {
        console.log(`❌ Failed: ${err.message}`);
      }
    }
  }
}

test();
