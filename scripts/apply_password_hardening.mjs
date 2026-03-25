import { createSupabaseAdminClient, loadSupabaseProject, authAdminUpdateUserById } from './load-supabase-env.mjs';

async function applyHardening(env) {
  const project = loadSupabaseProject(env);
  const token = 'sbp_a59d08fd6ca69466d51b887edda8d2ab84e15022'; // From tmp_run_sql.mjs
  const supabase = createSupabaseAdminClient(env);

  console.log(`--- Applying Password Hardening in ${env} ---`);

  // 1. Add column to public.users
  const sqlAddColumn = `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;`;
  
  console.log('Adding must_change_password column...');
  const res1 = await fetch(`https://api.supabase.com/v1/projects/${project.ref}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sqlAddColumn })
  });
  console.log('SQL Status:', res1.status);

  // 2. Identify users with insecure passwords (last 6 digits matching)
  console.log('Identifying insecure passwords...');
  const { data: users, error } = await supabase
    .from('users')
    .select('user_id, auth_user_id, user_identification, user_password')
    .not('user_password', 'is', null)
    .not('user_identification', 'is', null)
    .eq('must_change_password', false);

  if (error) {
    console.error(error);
    return;
  }

  let count = 0;
  for (const user of users) {
    const doc = String(user.user_identification).trim().replace(/\D/g, '');
    const pattern = doc.length >= 6 ? doc.slice(-6) : doc.padStart(6, '0');
    
    if (user.user_password === pattern) {
      try {
        // Update public.users
        const { error: updateError } = await supabase.from('users').update({ must_change_password: true }).eq('user_id', user.user_id);
        if (updateError) throw updateError;
        
        // Update auth.users metadata
        if (user.auth_user_id) {
            await authAdminUpdateUserById(env, user.auth_user_id, {
              user_metadata: { must_change_password: true }
            });
        }
        count++;
      } catch (e) {
        console.error(`Error updating user ${user.user_id}:`, e.message);
      }
    }
  }

  console.log(`Finished. Marked ${count} users out of ${users.length}.`);
}

const env = process.argv[2] || 'staging';
applyHardening(env);

