import { loadSupabaseProject } from './scripts/load-supabase-env.mjs';

// No import needed for fetch in Node.js 18+

async function testManagementKey(projectRef, managementKey, label) {
  console.log(`\n--- Testing Management API for ${label} (${projectRef}) ---`);
  
  try {
    // Try to list schemas as a lightweight check
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'SELECT schema_name FROM information_schema.schemata' }),
    });

    if (res.ok) {
      console.log(`✅ ${label}: Management API is accessible!`);
      const data = await res.json();
      console.log(`Success! Found ${data.length} schemas.`);
      return true;
    } else {
      const text = await res.text();
      console.log(`❌ ${label}: Management API failed (${res.status}): ${text}`);
      return false;
    }
  } catch (e) {
    console.log(`❌ ${label}: Error calling Management API:`, e.message);
    return false;
  }
}

async function run() {
  const staging = loadSupabaseProject('staging');
  const production = loadSupabaseProject('production');

  await testManagementKey(staging.ref, staging.secretKey || staging.serviceRoleKey, staging.label);
  await testManagementKey(production.ref, production.secretKey || production.serviceRoleKey, production.label);
}

run();
