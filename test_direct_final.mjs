import pg from 'pg';
const { Client } = pg;

const candidates = [
  { name: 'STAGING', host: 'db.pnnrsqocukixusmzrlhy.supabase.co' },
  { name: 'PRODUCTION', host: 'db.ysorlqfwqccsgxxkpzdx.supabase.co' }
];

const passwords = ['*Alexis12', '*Alexis1144063158'];

async function testConnection() {
  for (const db of candidates) {
    for (const pwd of passwords) {
      console.log(`Trying ${db.name} with ${pwd.substring(0,3)}... on port 5432`);
      const client = new Client({
        host: db.host,
        port: 5432,
        user: 'postgres',
        password: pwd,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
      });

      try {
        await client.connect();
        console.log(`✅ SUCCESS! ${db.name} password is ${pwd}`);
        await client.end();
        process.exit(0);
      } catch (err) {
        console.log(`❌ ${db.name} failed: ${err.message}`);
      }
    }
  }
}

testConnection();
