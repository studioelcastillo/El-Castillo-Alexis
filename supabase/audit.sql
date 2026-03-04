WITH target(table_name) AS (
  VALUES
    ('users'),
    ('profiles'),
    ('studios'),
    ('studios_models'),
    ('studios_rooms'),
    ('petitions'),
    ('petition_states'),
    ('attendance_devices'),
    ('attendance_employees'),
    ('attendance_transactions'),
    ('attendance_daily'),
    ('settings'),
    ('transactions'),
    ('transactions_types'),
    ('content_platforms'),
    ('content_assets'),
    ('content_tasks'),
    ('chat_profiles'),
    ('chat_policies'),
    ('chat_conversations'),
    ('chat_conversation_members'),
    ('chat_messages'),
    ('chat_templates'),
    ('chat_broadcast_jobs'),
    ('chat_broadcast_lists'),
    ('chat_automations'),
    ('chat_automation_jobs')
),
table_info AS (
  SELECT t.table_name,
         c.oid IS NOT NULL AS exists,
         COALESCE(c.relrowsecurity, false) AS rls_enabled,
         COALESCE(p.policy_count, 0) AS policies
  FROM target t
  LEFT JOIN pg_class c ON c.relname = t.table_name
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS policy_count
    FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = t.table_name
  ) p ON true
)
SELECT 'tables' AS section,
       jsonb_agg(to_jsonb(table_info)) AS data
FROM table_info

UNION ALL
SELECT 'settings_keys' AS section,
       jsonb_agg(jsonb_build_object('key', set_key, 'has_value', set_value IS NOT NULL)) AS data
FROM settings
WHERE set_key IN ('attendance_integration', 'attendance_valuation')

UNION ALL
SELECT 'buckets' AS section,
       jsonb_agg(jsonb_build_object('name', name, 'public', public)) AS data
FROM storage.buckets

UNION ALL
SELECT 'functions' AS section,
       jsonb_build_object(
         'get_dashboard_tasks', EXISTS(
           SELECT 1 FROM pg_proc pr
           JOIN pg_namespace ns ON ns.oid = pr.pronamespace
           WHERE pr.proname = 'get_dashboard_tasks' AND ns.nspname = 'public'
         ),
         'update_updated_at_column', EXISTS(
           SELECT 1 FROM pg_proc pr
           JOIN pg_namespace ns ON ns.oid = pr.pronamespace
           WHERE pr.proname = 'update_updated_at_column' AND ns.nspname = 'public'
         )
       ) AS data

UNION ALL
SELECT 'indexes' AS section,
       jsonb_agg(jsonb_build_object('index', indexname, 'table', tablename)) AS data
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'attendance_devices_sn_key',
    'attendance_employees_emp_code_key',
    'attendance_transactions_unique_key'
  )

UNION ALL
SELECT 'petitions_columns' AS section,
       jsonb_agg(jsonb_build_object('column', column_name, 'default', column_default)) AS data
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'petitions'
  AND column_name IN ('ptn_state', 'stdmod_id', 'ptn_observation')

UNION ALL
SELECT 'attendance_columns' AS section,
       jsonb_agg(jsonb_build_object('table', table_name, 'column', column_name)) AS data
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('attendance_devices', 'attendance_employees', 'attendance_transactions', 'attendance_daily')
  AND column_name IN ('device_sn', 'emp_code', 'linked_user_id', 'punch_time', 'punch_state')

UNION ALL
SELECT 'storage_policies' AS section,
       jsonb_agg(jsonb_build_object('table', tablename, 'policy', policyname, 'cmd', cmd)) AS data
FROM pg_policies
WHERE schemaname = 'storage';
