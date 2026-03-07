import pg from 'pg';
const { Client } = pg;
import fs from 'fs';

const PROJECT_ID = process.env.SUPABASE_PROJECT_ID;
const PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const host = process.env.SUPABASE_DB_HOST || 'aws-1-us-east-1.pooler.supabase.com';
const port = Number(process.env.SUPABASE_DB_PORT || 6543);
const connectionString = process.env.SUPABASE_DB_CONNECTION ||
  (PROJECT_ID && PASSWORD
    ? `postgresql://postgres.${PROJECT_ID}:${encodeURIComponent(PASSWORD)}@${host}:${port}/postgres`
    : '');

const file = process.env.SQL_FILE || 'supabase/full_init.sql';

if (!connectionString) {
  console.error('Missing SUPABASE_DB_CONNECTION or SUPABASE_PROJECT_ID + SUPABASE_DB_PASSWORD.');
  process.exit(1);
}

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`Connecting to ${PROJECT_ID}...`);
    await client.connect();
    console.log('Connected. Reading SQL...');

    const fullSql = fs.readFileSync(file, 'utf8');

    // Split by semicolons, but this is naive for triggers/functions.
    // For this specific full_init.sql, we'll try to execute blocks.
    const statements = fullSql.split(/;\s*$/m);

    console.log(`Found ${statements.length} potential statements.`);

    for (let i = 0; i < statements.length; i++) {
      let stmt = statements[i].trim();
      if (!stmt) continue;

      try {
        process.stdout.write(`Executing statement ${i+1}/${statements.length}... `);
        await client.query(stmt);
        console.log('OK');
      } catch (err) {
        console.log('FAIL');
        console.error(`Error in statement ${i+1}:`, err.message);
        console.error('Statement was:', stmt.substring(0, 100) + '...');
        // We continue to see other errors
      }
    }

    console.log('\nProcess finished.');
  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    await client.end();
  }
}

run();
