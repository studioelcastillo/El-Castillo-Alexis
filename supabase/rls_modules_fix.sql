-- Add missing RLS policies for modules

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'accounts',
    'bank_accounts',
    'categories',
    'exchange_rates',
    'models_accounts',
    'models_goals',
    'models_streams',
    'models_streams_customers',
    'models_streams_files',
    'models_transactions',
    'payment_files',
    'paysheets',
    'periods',
    'products',
    'payroll_periods',
    'payroll_concepts',
    'payroll_transactions'
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
