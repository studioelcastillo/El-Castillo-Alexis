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

async function checkAuthMapping() {
  console.log(`Checking 'auth_user_id' mapping on Staging (${PROJECT_REF})...`);
  
  try {
    const mappingCount = await runQuery(`
      SELECT 
        count(*) as total_users,
        count(auth_user_id) as mapped_users
      FROM public.users;
    `);
    console.log("Mapping count:", JSON.stringify(mappingCount, null, 2));

    const sample = await runQuery(`
      SELECT user_id, user_email, auth_user_id, prof_id, std_id
      FROM public.users
      WHERE auth_user_id IS NOT NULL
      LIMIT 5;
    `);
    console.log("Mapped users sample:", JSON.stringify(sample, null, 2));
    
  } catch (e) {
    console.error("Error:", e.message);
  }
}

checkAuthMapping();
