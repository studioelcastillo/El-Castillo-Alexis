import { loadSupabaseProject } from './load-supabase-env.mjs';

async function checkProgress() {
  const project = loadSupabaseProject('staging');
  const token = 'sbp_a59d08fd6ca69466d51b887edda8d2ab84e15022';
  
  const sql = `SELECT count(*) as count FROM public.users WHERE must_change_password = true;`;
  
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${project.ref}/database/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql })
    });
    
    const data = await res.json();
    console.log('Progress:', data);
  } catch (e) {
    console.error(e);
  }
}

checkProgress();
