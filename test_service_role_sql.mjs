import { loadSupabaseProject } from './scripts/load-supabase-env.mjs';

const project = loadSupabaseProject('production');
const PROD_SERVICE_ROLE = project.secretKey || project.serviceRoleKey;
const PROJECT_REF = project.ref;

async function testSql() {
  console.log(`Testing SQL execution via Management API for ${PROJECT_REF}...`);
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PROD_SERVICE_ROLE}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'SELECT 1 as test' })
    });

    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

testSql();
