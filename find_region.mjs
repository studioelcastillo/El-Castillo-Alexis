import pg from 'pg';
const { Client } = pg;

const PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'pnnrsqocukixusmzrlhy';
const PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!PASSWORD) {
  console.error('Missing SUPABASE_DB_PASSWORD.');
  process.exit(1);
}

const regions = [
  'sa-east-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'ap-southeast-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-2',
  'ca-central-1'
];

async function testRegions() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const connectionString = `postgresql://postgres.${PROJECT_ID}:${encodeURIComponent(PASSWORD)}@${host}:6543/postgres`;
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });

    console.log(`Testing region: ${region} (${host})...`);
    try {
      await client.connect();
      console.log(`✅ SUCCESS found in region: ${region}`);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`❌ Failed ${region}: ${err.message}`);
    }
  }
  console.log('No working region found.');
}

testRegions();
