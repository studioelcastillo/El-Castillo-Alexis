// Unified Production Hardening and Fixes via Management API
const PROJECT_REF = 'ysorlqfwqccsgxxkpzdx';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'TU_SUPABASE_ACCESS_TOKEN';

async function runSql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Status ${res.status}: ${text}`);
    return null;
  }
  return res.json();
}

async function main() {
  console.log('--- STARTING UNIFIED SANITIZATION IN PRODUCTION ---');

  // 1. Fix NULL std_id
  console.log('Fixing NULL std_id...');
  const sqlFixStdId = `
    -- Owners
    UPDATE public.users u SET std_id = s.std_id FROM public.studios s WHERE u.prof_id = 2 AND u.std_id IS NULL AND s.user_id_owner = u.user_id;
    -- User 1885
    UPDATE public.users SET std_id = 73 WHERE user_id = 1885 AND std_id IS NULL;
    -- SuperAdmins
    UPDATE public.users SET std_id = 1 WHERE prof_id = 1 AND std_id IS NULL;
    -- Staff via historic associations
    UPDATE public.users u SET std_id = sub.std_id FROM (
        SELECT DISTINCT ON (user_id_model) user_id_model, std_id FROM public.studios_models ORDER BY user_id_model, created_at DESC
    ) sub WHERE u.prof_id IN (3, 7, 8, 11) AND u.std_id IS NULL AND sub.user_id_model = u.user_id;
  `;
  await runSql(sqlFixStdId);

  // 2. Add must_change_password column
  console.log('Adding must_change_password column...');
  await runSql('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;');

  // 3. Apply password hardening
  console.log('Applying password hardening...');
  const sqlHardening = `
    -- 3.1. Mark users in public.users whose password matches last 6 digits of identification
    -- (We use the same logic as the script: doc.length >= 6 ? doc.slice(-6) : doc.padStart(6, '0'))
    WITH insecure_users AS (
        SELECT user_id, auth_user_id 
        FROM public.users 
        WHERE user_password IS NOT NULL 
          AND user_identification IS NOT NULL
          AND must_change_password = false
          AND length(regexp_replace(user_identification, '\\D', '', 'g')) >= 1
          AND user_password = CASE 
            WHEN length(regexp_replace(user_identification, '\\D', '', 'g')) >= 6 
            THEN right(regexp_replace(user_identification, '\\D', '', 'g'), 6)
            ELSE lpad(regexp_replace(user_identification, '\\D', '', 'g'), 6, '0')
          END
    )
    UPDATE public.users u 
    SET must_change_password = true 
    FROM insecure_users i 
    WHERE u.user_id = i.user_id;

    -- 3.2. Update auth.users metadata for the same users
    WITH insecure_auth_users AS (
        SELECT auth_user_id 
        FROM public.users 
        WHERE must_change_password = true
    )
    UPDATE auth.users 
    SET raw_user_meta_data = (COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"must_change_password": true}'::jsonb)
    WHERE id IN (SELECT auth_user_id FROM insecure_auth_users WHERE auth_user_id IS NOT NULL);
  `;
  await runSql(sqlHardening);

  console.log('--- FINISHED ---');
}

main().catch(console.error);
