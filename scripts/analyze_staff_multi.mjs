import { createSupabaseAdminClient } from './load-supabase-env.mjs';

async function analyzeStaffAndMultiStudio(env) {
  console.log(`--- Staff and Multi-Studio analysis in ${env} ---`);
  const supabase = createSupabaseAdminClient(env);

  // 1. Staff with NULL std_id
  const { data: staffNull, error: e1 } = await supabase
    .from('users')
    .select('user_id, user_name, prof_id')
    .is('std_id', null)
    .in('prof_id', [1, 2, 3, 6, 7, 8, 11]);

  console.log('Staff with NULL std_id:', staffNull);

  // 2. Users with multiple active studios
  const { data: multiStudio, error: e2 } = await supabase
    .rpc('execute_sql', {
        sql_query: `
            SELECT sm.user_id_model, COUNT(DISTINCT sm.std_id) as studio_count
            FROM public.studios_models sm
            WHERE COALESCE(sm.stdmod_active, true) = true
            GROUP BY sm.user_id_model
            HAVING COUNT(DISTINCT sm.std_id) > 1
        `
    });
  
  if (e2) {
      // If execute_sql not allowed, try a manual approach or check if I can just query studios_models
      const { data: smData, error: e3 } = await supabase.from('studios_models').select('user_id_model, std_id').eq('stdmod_active', true);
      if (smData) {
          const userStudios = {};
          smData.forEach(r => {
              if (!userStudios[r.user_id_model]) userStudios[r.user_id_model] = new Set();
              userStudios[r.user_id_model].add(r.std_id);
          });
          const multi = Object.entries(userStudios).filter(([uid, studios]) => studios.size > 1);
          console.log(`Users with multiple active studios: ${multi.length}`);
          console.log(multi.slice(0, 5));
      }
  } else {
      console.log('Multi-studio users (via SQL):', multiStudio);
  }
}

analyzeStaffAndMultiStudio('staging');
