import { loadSupabaseProject } from './scripts/load-supabase-env.mjs';

async function applyRLS(projectRef, managementKey, label) {
  const sql = `
    -- Enable RLS on users if not already enabled
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    -- Drop existing policy if it exists to avoid errors on duplicate
    DROP POLICY IF EXISTS "Allow anon read for login lookup" ON public.users;

    -- Create policy to allow anonymous users to search by identification or email
    CREATE POLICY "Allow anon read for login lookup" ON public.users
    FOR SELECT
    TO anon, authenticated
    USING (true);
  `;

  console.log(`\n--- Applying RLS fix to ${label} (${projectRef}) ---`);

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (res.ok) {
      console.log(`✅ ${label}: RLS policy applied via Management API!`);
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

  await applyRLS(staging.ref, staging.secretKey || staging.serviceRoleKey, staging.label);
  await applyRLS(production.ref, production.secretKey || production.serviceRoleKey, production.label);
}

run();
