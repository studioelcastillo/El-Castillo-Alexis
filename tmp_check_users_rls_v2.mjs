const PROJECT_REF = 'pnnrsqocukixusmzrlhy';
const SECRET = 'sbp_a59d08fd6ca69466d51b887edda8d2ab84e15022';

async function runQuery(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SECRET}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  return await res.json();
}

async function checkRLSAndUsers() {
  console.log(`Checking RLS policies for 'users' on Staging (${PROJECT_REF})...`);
  
  try {
    const policies = await runQuery(`
      SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'users';
    `);
    console.log("Policies:", JSON.stringify(policies, null, 2));

    const users = await runQuery(`
      SELECT user_id, user_email, std_id, auth_user_id, prof_id
      FROM public.users
      LIMIT 10;
    `);
    console.log("Users sample:", JSON.stringify(users, null, 2));

    const adminCheck = await runQuery(`
        SELECT count(*) FROM public.users WHERE public.is_super_admin();
    `);
    console.log("SuperAdmins count:", JSON.stringify(adminCheck, null, 2));
    
  } catch (e) {
    console.error("Error:", e.message);
  }
}

checkRLSAndUsers();
