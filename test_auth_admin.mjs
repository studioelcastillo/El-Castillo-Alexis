import { loadSupabaseProject } from './scripts/load-supabase-env.mjs';

async function testSecret(url, secret, label) {
  console.log(`\n--- Testing Auth Admin for ${label} ---`);
  const response = await fetch(`${url}/auth/v1/admin/users?per_page=1`, {
    headers: {
      'apikey': secret,
      'Authorization': `Bearer ${secret}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    console.log(`✅ ${label}: Auth Admin access confirmed!`, data.users?.length ? "(Users found)" : "(No users)");
    return true;
  } else {
    const text = await response.text();
    console.log(`❌ ${label}: Auth Admin failed (${response.status}): ${text}`);
    return false;
  }
}

async function run() {
  const staging = loadSupabaseProject('staging');
  const production = loadSupabaseProject('production');

  await testSecret(staging.url, staging.secretKey || staging.serviceRoleKey, staging.label);
  await testSecret(production.url, production.secretKey || production.serviceRoleKey, production.label);
}

run();
