const PROJECT_REF = 'ysorlqfwqccsgxxkpzdx';
const TOKEN = 'sbp_a59d08fd6ca69466d51b887edda8d2ab84e15022';

async function runSql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) {
    console.error(`Status ${res.status}: ${await res.text()}`);
    return;
  }
  const data = await res.json();
  console.table(data);
}

runSql("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;");
