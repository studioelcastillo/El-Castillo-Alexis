const ref = 'pnnrsqocukixusmzrlhy';
const token = process.env.SUPABASE_ACCESS_TOKEN || 'TU_SUPABASE_ACCESS_TOKEN';

fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'SELECT count(*) FROM public.users WHERE must_change_password = true' })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
