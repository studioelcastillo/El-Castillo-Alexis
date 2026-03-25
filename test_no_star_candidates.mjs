import pg from 'pg';
const { Client } = pg;

const projects = [
  { name: 'STAGING', id: 'pnnrsqocukixusmzrlhy', host: 'aws-1-us-east-1.pooler.supabase.com' },
  { name: 'PRODUCTION', id: 'ysorlqfwqccsgxxkpzdx', host: 'aws-0-us-east-1.pooler.supabase.com' }
];

const passwords = ['Alexis12', 'Alexis1144063158'];

async function test() {
  for (const project of projects) {
    for (const password of passwords) {
      console.log(`Testing ${project.name} (NO STAR) with password candidate...`);
      const connectionString = `postgresql://postgres.${project.id}:${encodeURIComponent(password)}@${project.host}:6543/postgres`;
      const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });

      try {
        await client.connect();
        console.log(`✅ SUCCESS: ${project.name} database password is ${password}`);
        await client.end();
        process.exit(0);
      } catch (err) {
        console.log(`❌ Failed ${project.name} (${password}): ${err.message}`);
      }
    }
  }
}

test();
