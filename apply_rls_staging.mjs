import { loadSupabaseProject } from './scripts/load-supabase-env.mjs';

async function applyRLS() {
  const project = loadSupabaseProject('staging');
  const projectRef = project.ref;
  const serviceKey = project.secretKey || project.serviceRoleKey;

  const sql = `
    -- Enable RLS on users if not already enabled
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Policy for users were they can read their own record
    DROP POLICY IF EXISTS "Allow authenticated read own" ON public.users;
    CREATE POLICY "Allow authenticated read own" ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid() = auth_user_id);

    -- Policy for profiles: lookup table used in joins/role checks
    DROP POLICY IF EXISTS "Allow authenticated read profiles" ON public.profiles;
    CREATE POLICY "Allow authenticated read profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

    -- Policy for login lookup (anon read)
    DROP POLICY IF EXISTS "Allow anon read for login lookup" ON public.users;
    CREATE POLICY "Allow anon read for login lookup" ON public.users
    FOR SELECT
    TO anon, authenticated
    USING (true);
  `;

  console.log("Applying RLS fix to Staging...");

  // Try via pg-meta query API (some projects have this enabled for service role)
  // Actually, the management API is api.supabase.com, but service role key might not be enough.
  // Let's try to run it via a REST RPC if it exists.
  
  // Alternative: Try to just use the REST API to see if we can at least check if it works.
  // Actually, I'll try the api.supabase.com endpoint with the service key just in case.
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (res.ok) {
      console.log("✅ RLS policy applied via Management API!");
      return;
    } else {
      const text = await res.text();
      console.log(`❌ Management API failed (${res.status}): ${text}`);
    }
  } catch (e) {
    console.log("❌ Error calling Management API:", e.message);
  }

  console.log("RLS policy could not be applied automatically. Please run the SQL manually in Supabase SQL Editor.");
}

applyRLS();
