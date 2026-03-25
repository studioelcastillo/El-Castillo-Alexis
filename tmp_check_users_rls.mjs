const PROJECT_REF = 'pnnrsqocukixusmzrlhy';
const SECRET = process.env.SUPABASE_ACCESS_TOKEN || 'TU_SUPABASE_ACCESS_TOKEN';

async function checkRLSAndUsers() {
  console.log(`Checking RLS policies for 'users' on Staging (${PROJECT_REF})...`);
  
  const sql = `
    -- Check policies
    SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'users';

    -- Check if users have std_id
    SELECT user_id, user_email, std_id, auth_user_id
    FROM public.users
    LIMIT 10;
    
    -- Check current auth context if possible (though this runs as service role/postgres)
    SELECT auth.uid(), public.is_super_admin();
  `;

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Result:", JSON.stringify(data, null, 2));
    
  } catch (e) {
    console.error("Error:", e.message);
  }
}

checkRLSAndUsers();
