const ref = 'pnnrsqocukixusmzrlhy';
const token = 'sbp_a59d08fd6ca69466d51b887edda8d2ab84e15022';

fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'SELECT count(*) FROM public.users WHERE must_change_password = true' })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
