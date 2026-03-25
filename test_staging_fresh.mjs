import pg from 'pg';
const { Client } = pg;

const project = { name: 'staging', id: 'pnnrsqocukixusmzrlhy', host: 'aws-1-us-east-1.pooler.supabase.com' };

const passwords = [
  '*Alexis1144063158',
  '*Alexis12',
  'Alexis1144063158',
  'Alexis12'
];

async function test() {
  for (const password of passwords) {
    for (const port of [6543, 5432]) {
      console.log(`Testing Staging (${project.id}) with "${password.substring(0, 7)}..." on port ${port}...`);
      const client = new Client({
        user: `postgres.${project.id}`,
        host: project.host,
        database: 'postgres',
        password: password,
        port: port,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });

      try {
        await client.connect();
        console.log(`✅ SUCCESS! Project: ${project.name}, Password: ${password}, Port: ${port}`);
        await client.end();
        process.exit(0);
      } catch (err) {
        console.log(`❌ Failed: ${err.message}`);
      }
    }
  }
}

test();
