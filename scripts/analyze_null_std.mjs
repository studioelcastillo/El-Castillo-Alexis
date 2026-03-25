import { createSupabaseAdminClient } from './load-supabase-env.mjs';

async function analyzeNullStdId(env) {
  console.log(`--- Analyzing NULL std_id in ${env} ---`);
  const supabase = createSupabaseAdminClient(env);

  // Get users with NULL std_id
  const { data: nullStdUsers, error: errorUsers } = await supabase
    .from('users')
    .select('user_id, user_name, user_email, prof_id')
    .is('std_id', null);

  if (errorUsers) {
    console.error(errorUsers);
    return;
  }

  console.log(`Total users with NULL std_id: ${nullStdUsers.length}`);

  // Count by prof_id (Role)
  const roleCounts = {};
  nullStdUsers.forEach(u => {
    roleCounts[u.prof_id] = (roleCounts[u.prof_id] || 0) + 1;
  });
  console.log('Role Distribution for NULL std_id users:', roleCounts);

  // Check relations for a sample of these users
  const sampleIds = nullStdUsers.slice(0, 10).map(u => u.user_id);
  
  console.log('--- Sample relations check ---');
  for (const uid of sampleIds) {
    const { data: ownerOf } = await supabase.from('studios').select('std_id').eq('user_id_owner', uid);
    const { data: modelOf } = await supabase.from('studios_models').select('std_id, stdmod_active').eq('user_id_model', uid);
    
    console.log(`User ID ${uid}: Owner of ${ownerOf?.length || 0} studios | Model in ${modelOf?.length || 0} studios (${modelOf?.filter(m => m.stdmod_active)?.length || 0} active)`);
  }
}

analyzeNullStdId('staging');
