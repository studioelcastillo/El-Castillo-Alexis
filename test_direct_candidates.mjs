import pg from 'pg';
const { Client } = pg;

const projects = [
  { name: 'STAGING', id: 'pnnrsqocukixusmzrlhy', host: 'db.pnnrsqocukixusmzrlhy.supabase.co' },
  { name: 'PRODUCTION', id: 'ysorlqfwqccsgxxkpzdx', host: 'db.ysorlqfwqccsgxxkpzdx.supabase.co' }
];

const passwords = ['*Alexis12', '*Alexis1144063158'];

async function test() {
  for (const project of projects) {
    for (const password of passwords) {
      console.log(`Testing DIRECT ${project.name} with password candidate...`);
      // For direct connection, user is just 'postgres'
      const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@${project.host}:5432/postgres`;
      const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
      });

      try {
        await client.connect();
        console.log(`✅ SUCCESS: ${project.name} DIRECT database password is ${password}`);
        await client.end();
        process.exit(0);
      } catch (err) {
        console.log(`❌ Failed DIRECT ${project.name} (${password.substring(0,3)}...): ${err.message}`);
      }
    }
  }
  console.log('No working password found in this batch.');
}

test();
