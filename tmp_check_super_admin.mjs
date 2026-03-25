const PROJECT_REF = 'pnnrsqocukixusmzrlhy';
const SECRET = process.env.SUPABASE_ACCESS_TOKEN || 'TU_SUPABASE_ACCESS_TOKEN';

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

async function checkFunction() {
  console.log(`Checking 'is_super_admin' definition on Staging (${PROJECT_REF})...`);
  
  try {
    const fnDef = await runQuery(`
      SELECT pg_get_functiondef(p.oid)
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'is_super_admin';
    `);
    console.log("Function Definition:", JSON.stringify(fnDef, null, 2));

    const roles = await runQuery(`
      SELECT user_id, user_email, prof_id FROM public.users WHERE prof_id = 1;
    `);
    console.log("Users with prof_id=1:", JSON.stringify(roles, null, 2));
    
  } catch (e) {
    console.error("Error:", e.message);
  }
}

checkFunction();
