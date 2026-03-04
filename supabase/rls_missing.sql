-- Fix missing RLS policies for dashboard tables

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'profiles',
    'studios_models',
    'studios_rooms',
    'petitions',
    'settings',
    'transactions',
    'transactions_types'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = t
        AND policyname = 'authenticated_full_access'
    ) THEN
      EXECUTE format(
        'CREATE POLICY authenticated_full_access ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);',
        t
      );
    END IF;
  END LOOP;
END $$;
