import { loadSupabaseProject } from './scripts/load-supabase-env.mjs';

const project = loadSupabaseProject('staging');
const SERVICE_ROLE = project.serviceRoleKey || project.secretKey;
const PROJECT_REF = project.ref;

async function testSql() {
  console.log(`Testing SQL execution via Management API for STAGING (${PROJECT_REF})...`);
  if (!SERVICE_ROLE) {
    console.error("Missing SERVICE_ROLE key.");
    return;
  }

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'SELECT 1 as test' })
    });

    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
    
    if (res.ok) {
        console.log("✅ SUCCESS: We can run SQL via API!");
    } else {
        console.log("❌ FAILED: Service Role key might not have Management API access.");
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

testSql();
