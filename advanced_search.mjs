import pg from 'pg';
const { Client } = pg;

const projects = [
  { name: 'staging', id: 'pnnrsqocukixusmzrlhy' },
  { name: 'production', id: 'ysorlqfwqccsgxxkpzdx' }
];

const regions = ['us-east-1', 'us-east-2', 'sa-east-1', 'eu-west-1'];
const prefixes = ['aws-0', 'aws-1'];

const passwords = ['*Alexis12', 'root#Alexis1144063158'];

async function search() {
  for (const project of projects) {
    console.log(`\n=== Searching for ${project.name} (${project.id}) ===`);
    for (const prefix of prefixes) {
      for (const region of regions) {
        for (const pwd of passwords) {
          const host = `${prefix}-${region}.pooler.supabase.com`;
          console.log(`Testing ${host} with ${pwd.substring(0,5)}...`);
          const client = new Client({
            user: `postgres.${project.id}`,
            host: host,
            database: 'postgres',
            password: pwd,
            port: 6543,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 3000
          });

          try {
            await client.connect();
            console.log(`✅ SUCCESS! Project: ${project.name}, Host: ${host}, Pwd: ${pwd}`);
            await client.end();
            // Done with this project
            break;
          } catch (err) {
            // If it says "password authentication failed", the host is LIKELY correct but pwd wrong.
            // If it says "Tenant not found" or "ETIMEDOUT", the host is wrong.
            if (err.message.includes('password authentication failed')) {
               console.log(`⚠️ Host seems correct (${host}) but password failed.`);
            } else {
               // console.log(`❌ ${host} failed: ${err.message}`);
            }
          }
        }
      }
    }
  }
}

search();
