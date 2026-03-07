-- Deprecated: tenant_hardening.sql now owns settings access.
-- Keep this file only to remove the legacy broad read policy if it still exists.

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS settings_read_app_keys ON public.settings';
END $$;
