import { createSupabaseAdminClient } from './load-supabase-env.mjs';

async function fixUserStdId(env) {
  console.log(`--- Fixing NULL std_id in ${env} ---`);
  const supabase = createSupabaseAdminClient(env);

  // 1. Fix Owners (prof_id=2)
  console.log('Resolving Owners...');
  const { data: owners, error: e1 } = await supabase
    .from('users')
    .select('user_id, prof_id')
    .is('std_id', null)
    .eq('prof_id', 2);
  
  for (const owner of owners || []) {
      const { data: studios } = await supabase.from('studios').select('std_id').eq('user_id_owner', owner.user_id).limit(1);
      if (studios && studios.length > 0) {
          console.log(`Updating Owner ${owner.user_id} to std_id ${studios[0].std_id}`);
          await supabase.from('users').update({ std_id: studios[0].std_id }).eq('user_id', owner.user_id);
      }
  }

  // 2. Fix Multi-Studio User 1885
  console.log('Resolving Multi-Studio User 1885...');
  // Logic: pick the most recent studio or studio 73 (based on my previous check)
  await supabase.from('users').update({ std_id: 73 }).eq('user_id', 1885).is('std_id', null);

  // 3. Fix SuperAdmins (prof_id=1)
  console.log('Resolving SuperAdmins...');
  await supabase.from('users').update({ std_id: 1 }).eq('prof_id', 1).is('std_id', null);

  // 4. Fix other staff (Monitors, Coordinators) from historic associations
  console.log('Resolving staff via studios_models (even if inactive)...');
  const { data: staff, error: e2 } = await supabase
    .from('users')
    .select('user_id')
    .is('std_id', null)
    .in('prof_id', [3, 7, 8, 11]);

  for (const s of staff || []) {
      const { data: sm } = await supabase.from('studios_models').select('std_id').eq('user_id_model', s.user_id).limit(1);
      if (sm && sm.length > 0) {
          console.log(`Updating staff ${s.user_id} to historic std_id ${sm[0].std_id}`);
          await supabase.from('users').update({ std_id: sm[0].std_id }).eq('user_id', s.user_id);
      }
  }

  console.log('Done.');
}

// NOTE: This script is prepared for review. Do not run on production without confirmation.
const env = process.argv[2] || 'staging';
fixUserStdId(env);

