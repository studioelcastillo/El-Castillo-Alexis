import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('staging');

async function createRpc() {
  const sql = `
    CREATE OR REPLACE FUNCTION public.change_user_password(uid uuid, new_password text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, auth
    AS $$
    BEGIN
      UPDATE auth.users
      SET encrypted_password = crypt(new_password, gen_salt('bf')),
          updated_at = now()
      WHERE id = uid;
    END;
    $$;

    GRANT EXECUTE ON FUNCTION public.change_user_password(uuid, text) TO service_role;
  `;

  console.log("Creating change_user_password RPC...");
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.log("❌ Error executing RPC:", error.message);
  } else {
    console.log("✅ RPC created successfully!");
  }
}

createRpc();
