-- Prepare imported legacy users for Supabase Auth.
-- Converts non-email login values into usable auth emails while preserving login by identification.

UPDATE public.users
SET user_email = LOWER(
  TRIM(
    CASE
      WHEN COALESCE(NULLIF(user_personal_email, ''), '') LIKE '%@%'
        THEN user_personal_email
      WHEN COALESCE(NULLIF(user_identification, ''), '') <> ''
        THEN user_identification || '@legacy.elcastillo.local'
      ELSE 'user-' || user_id::text || '@legacy.elcastillo.local'
    END
  )
)
WHERE user_email IS NULL
   OR user_email NOT LIKE '%@%';

CREATE TEMP TABLE legacy_auth_seed AS
SELECT
  u.user_id,
  COALESCE(u.auth_user_id, gen_random_uuid()) AS auth_id,
  LOWER(TRIM(u.user_email)) AS auth_email,
  regexp_replace(u.user_password, '^\$2y\$', '\$2a\$') AS encrypted_password,
  COALESCE(u.email_verified_at, u.created_at, NOW()) AS confirmed_at,
  COALESCE(u.created_at, NOW()) AS created_at,
  COALESCE(u.updated_at, NOW()) AS updated_at
FROM public.users u
WHERE u.user_password IS NOT NULL
  AND u.user_email IS NOT NULL
  AND u.user_email LIKE '%@%';

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  email_change_token_current,
  email_change_confirm_status,
  reauthentication_token,
  is_sso_user,
  is_anonymous
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  seed.auth_id,
  'authenticated',
  'authenticated',
  seed.auth_email,
  seed.encrypted_password,
  seed.confirmed_at,
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('legacy_user_id', seed.user_id),
  false,
  seed.created_at,
  seed.updated_at,
  '',
  0,
  '',
  false,
  false
FROM legacy_auth_seed seed
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = seed.auth_id OR au.email = seed.auth_email
);

INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  id
)
SELECT
  seed.auth_email,
  seed.auth_id,
  jsonb_build_object('sub', seed.auth_id::text, 'email', seed.auth_email),
  'email',
  seed.updated_at,
  seed.created_at,
  seed.updated_at,
  seed.auth_id
FROM legacy_auth_seed seed
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities ai WHERE ai.user_id = seed.auth_id OR ai.email = seed.auth_email
);

UPDATE public.users u
SET auth_user_id = seed.auth_id,
    updated_at = GREATEST(COALESCE(u.updated_at, NOW()), seed.updated_at)
FROM legacy_auth_seed seed
WHERE u.user_id = seed.user_id
  AND (u.auth_user_id IS NULL OR u.auth_user_id <> seed.auth_id);

DROP TABLE legacy_auth_seed;
