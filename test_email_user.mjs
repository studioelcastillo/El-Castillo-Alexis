import pg from 'pg';
const { Client } = pg;

const projects = [
  { name: 'STAGING', id: 'pnnrsqocukixusmzrlhy', host: 'aws-1-us-east-1.pooler.supabase.com' }
];

const users = [
  'gerencia1elcastillo@gmail.com',
  'gerencia1elcastillo',
  'postgres'
];

const passwords = ['*Alexis12', '*Alexis1144063158'];

async function test() {
  for (const project of projects) {
    for (const user of users) {
      for (const password of passwords) {
        console.log(`Testing ${project.name} user=${user} password=${password.substring(0,3)}...`);
        const connectionString = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${project.host}:6543/postgres`;
        const client = new Client({
          connectionString,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000
        });

        try {
          await client.connect();
          console.log(`✅ SUCCESS: ${project.name} user=${user} password=${password}`);
          await client.end();
          process.exit(0);
        } catch (err) {
          console.log(`❌ Failed: ${err.message}`);
        }
      }
    }
  }
}

test();
