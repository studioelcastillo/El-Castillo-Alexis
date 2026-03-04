SELECT jsonb_build_object(
  'petitions_table', to_regclass('public.petitions') IS NOT NULL,
  'petition_states_table', to_regclass('public.petition_states') IS NOT NULL,
  'petitions_ptn_state_default', (
    SELECT column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'petitions'
      AND column_name = 'ptn_state'
  ),
  'petitions_has_stdmod_id', (
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'petitions'
        AND column_name = 'stdmod_id'
    )
  ),
  'petition_states_columns', (
    SELECT jsonb_agg(column_name ORDER BY column_name)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'petition_states'
  ),
  'petition_states_count', (
    SELECT COUNT(*)
    FROM petition_states
  ),
  'get_dashboard_tasks_exists', (
    SELECT EXISTS (
      SELECT 1
      FROM pg_proc
      JOIN pg_namespace ns ON ns.oid = pg_proc.pronamespace
      WHERE pg_proc.proname = 'get_dashboard_tasks'
        AND ns.nspname = 'public'
    )
  )
) AS summary;
