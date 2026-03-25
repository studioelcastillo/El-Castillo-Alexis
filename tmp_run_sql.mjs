const PROJECT_REF = 'pnnrsqocukixusmzrlhy';
const SECRET = process.env.SUPABASE_ACCESS_TOKEN || 'TU_SUPABASE_ACCESS_TOKEN';

const sql = `
ALTER TABLE person_documents ADD COLUMN IF NOT EXISTS legacy_label VARCHAR(80);
ALTER TABLE person_documents ADD COLUMN IF NOT EXISTS file_type VARCHAR(40);
ALTER TABLE person_documents ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(120);
ALTER TABLE person_documents ADD COLUMN IF NOT EXISTS storage_path VARCHAR(500);
ALTER TABLE person_documents ADD COLUMN IF NOT EXISTS public_url VARCHAR(500);
`;

async function runSql() {
  console.log("Applying missing columns to person_documents...");
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SECRET}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

runSql();
