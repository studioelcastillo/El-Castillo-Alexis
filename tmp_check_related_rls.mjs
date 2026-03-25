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

async function checkRelatedRLS() {
  console.log(`Checking RLS policies for 'profiles' and 'studios' on Staging (${PROJECT_REF})...`);
  
  try {
    const policies = await runQuery(`
      SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename IN ('profiles', 'studios');
    `);
    console.log("Policies:", JSON.stringify(policies, null, 2));

    const profilesCount = await runQuery(`SELECT count(*) FROM public.profiles;`);
    console.log("Profiles count:", JSON.stringify(profilesCount, null, 2));

    const studiosCount = await runQuery(`SELECT count(*) FROM public.studios;`);
    console.log("Studios count:", JSON.stringify(studiosCount, null, 2));
    
  } catch (e) {
    console.error("Error:", e.message);
  }
}

checkRelatedRLS();
