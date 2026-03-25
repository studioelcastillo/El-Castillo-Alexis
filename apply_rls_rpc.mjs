import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('staging');

async function applyRLS() {
  const sql = `
    -- Enable RLS
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Policy for users: read own record
    DROP POLICY IF EXISTS "Allow authenticated read own" ON public.users;
    CREATE POLICY "Allow authenticated read own" ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid() = auth_user_id);

    -- Policy for profiles: allow authenticated read (lookup table)
    DROP POLICY IF EXISTS "Allow authenticated read profiles" ON public.profiles;
    CREATE POLICY "Allow authenticated read profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

    -- Ensure anon read for login lookup
    DROP POLICY IF EXISTS "Allow anon read for login lookup" ON public.users;
    CREATE POLICY "Allow anon read for login lookup" ON public.users
    FOR SELECT TO anon, authenticated
    USING (true);
  `;

  console.log("Applying RLS fix via exec_sql RPC...");
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.log("❌ Error executing RPC:", error.message);
    console.log("Code:", error.code);
  } else {
    console.log("✅ RLS Fix applied successfully!");
  }
}

applyRLS();
