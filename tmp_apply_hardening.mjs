const PROJECT_REF = 'pnnrsqocukixusmzrlhy';
const SECRET = 'sbp_a59d08fd6ca69466d51b887edda8d2ab84e15022';
import fs from 'fs';

async function applyHardening() {
  const sqlFiles = [
    'supabase/tenant_hardening.sql'
  ];

  for (const file of sqlFiles) {
    console.log(`Reading ${file}...`);
    const sql = fs.readFileSync(file, 'utf8');
    
    console.log(`Applying ${file} to Staging (${PROJECT_REF})...`);
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
      const text = await res.text();
      // console.log("Response:", text);
      
      if (res.ok) {
        console.log(`✅ Successfully applied ${file}`);
      } else {
        console.log(`❌ Failed to apply ${file}:`, text);
      }
    } catch (e) {
      console.error("Error:", e.message);
    }
  }
}

applyHardening();
