import { loadSupabaseProject } from './load-supabase-env.mjs';

async function checkProgress() {
  const project = loadSupabaseProject('staging');
const token = process.env.SUPABASE_ACCESS_TOKEN || 'TU_SUPABASE_ACCESS_TOKEN';
  
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
