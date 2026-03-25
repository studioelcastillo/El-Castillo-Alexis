const PROJECT_REF = 'pnnrsqocukixusmzrlhy';
const SECRET = 'sbp_a59d08fd6ca69466d51b887edda8d2ab84e15022';

async function runDiagnostics() {
  console.log(`Running diagnostics for Staging (${PROJECT_REF})...`);
  
  const queries = [
    { name: 'current_user', sql: 'SELECT current_user, session_user;' },
    { name: 'roles', sql: 'SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin FROM pg_roles WHERE rolcanlogin = true;' },
    { name: 'grants', sql: "GRANT ALL ON SCHEMA public TO studiocore; GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO studiocore; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO studiocore; GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO studiocore; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO studiocore; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO studiocore; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO studiocore;" },
    { name: 'verify_grants', sql: "SELECT table_name, privilege_type FROM information_schema.table_privileges WHERE grantee = 'studiocore' LIMIT 5;" }
  ];

  for (const q of queries) {
    console.log(`\n--- Executing: ${q.name} ---`);
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SECRET}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: q.sql })
      });

      if (!res.ok) {
        console.error(`❌ Failed: ${res.status} ${await res.text()}`);
        continue;
      }

      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Error:", e.message);
    }
  }
}

runDiagnostics();
