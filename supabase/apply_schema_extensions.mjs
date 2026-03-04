import { readFile } from 'node:fs/promises';

const DEFAULT_SQL_PATH = 'apps/dashboard/supabase/schema_extensions.sql';
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.argv[2];
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.argv[3];
const SQL_PATH = process.env.SUPABASE_SQL_PATH || process.argv[4] || DEFAULT_SQL_PATH;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('Usage: node supabase/apply_schema_extensions.mjs <supabase_url> <service_role_key> [sql_path]');
  console.log('Or set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
  process.exit(1);
}

const getProjectRef = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.split('.')[0];
  } catch {
    return null;
  }
};

const executeSqlViaPgMeta = async (projectRef, sql) => {
  const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed (${res.status}): ${text}`);
  }

  return res.json();
};

const main = async () => {
  const projectRef = getProjectRef(SUPABASE_URL);
  if (!projectRef) {
    throw new Error('Invalid SUPABASE_URL. Expected https://<project>.supabase.co');
  }

  const sql = await readFile(SQL_PATH, 'utf8');
  console.log(`Applying schema extensions from ${SQL_PATH}...`);

  const result = await executeSqlViaPgMeta(projectRef, sql);
  const count = Array.isArray(result) ? result.length : 0;
  console.log(`Done. Result rows: ${count}`);
};

main().catch((err) => {
  console.error('Error applying schema extensions:', err.message);
  process.exit(1);
});
