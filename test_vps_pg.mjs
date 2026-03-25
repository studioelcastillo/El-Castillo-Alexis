import pg from 'pg';
const { Client } = pg;

const host = '72.61.0.135'; 
const user = 'postgres';
const passwords = ['*Alexis12', '*Alexis1144063158'];

async function testConnection() {
  for (const pwd of passwords) {
    console.log(`Trying VPS ${host} with user postgres, password ${pwd.substring(0,3)}... on port 5432`);
    const client = new Client({
      host: host,
      port: 5432,
      user: user,
      password: pwd,
      database: 'postgres',
      ssl: false, // VPS might not have SSL configured for PG
      connectionTimeoutMillis: 10000
    });

    try {
      await client.connect();
      console.log(`✅ SUCCESS! VPS PostgreSQL password is ${pwd}`);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`❌ VPS failed: ${err.message}`);
    }
  }
}

testConnection();
