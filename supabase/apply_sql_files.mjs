import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
let projectId = process.env.SUPABASE_PROJECT_ID || 'pnnrsqocukixusmzrlhy';
const files = [];

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--project' && args[i + 1]) {
    projectId = args[i + 1];
    i += 1;
    continue;
  }
  files.push(arg);
}

const accessToken = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ACCESS_TOKEN;

if (!accessToken) {
  console.log('Missing SUPABASE_SERVICE_KEY (or SUPABASE_ACCESS_TOKEN).');
  process.exit(1);
}

if (files.length === 0) {
  console.log('Usage: node supabase/apply_sql_files.mjs --project <project_id> <sql-file> [more-sql-files]');
  process.exit(1);
}

const run = async () => {
  for (const file of files) {
    const filePath = path.resolve(file);
    const sql = await fs.readFile(filePath, 'utf8');
    if (!sql.trim()) {
      console.log(`Skipping empty file: ${filePath}`);
      continue;
    }

    console.log(`\nExecuting: ${filePath}`);
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed (${res.status}): ${text}`);
    }

    const data = await res.json().catch(() => null);
    if (Array.isArray(data) && data.length) {
      console.log(`Done (${data.length} rows)`);
    } else {
      console.log('Done');
    }
  }
};

run().catch((error) => {
  console.error('\nError applying SQL:', error.message);
  process.exit(1);
});
