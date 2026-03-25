import pg from 'pg';
const { Client } = pg;

const host = '127.0.0.1'; 
const user = 'postgres';
const passwords = ['*Alexis12', '*Alexis1144063158'];

async function testConnection() {
  for (const pwd of passwords) {
    console.log(`Trying Localhost ${host} with user postgres, password ${pwd.substring(0,3)}... on port 5432`);
    const client = new Client({
      host: host,
      port: 5432,
      user: user,
      password: pwd,
      database: 'postgres',
      ssl: false,
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      console.log(`✅ SUCCESS! Localhost PostgreSQL password is ${pwd}`);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`❌ Localhost failed: ${err.message}`);
    }
  }
}

testConnection();
