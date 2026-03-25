import { loadSupabaseProject } from './load-supabase-env.mjs';

async function testToken() {
  const project = loadSupabaseProject('staging');
  // Use the token from tmp_run_sql.mjs or environment
  const token = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_a59d08fd6ca69466d51b887edda8d2ab84e15022';
  
  console.log(`Testing token for project ${project.ref}...`);
  
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${project.ref}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'SELECT 1' }),
    });
    
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
    
    if (res.ok) {
        console.log('TOKEN WORKS!');
    } else {
        console.log('TOKEN FAILED.');
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

testToken();
