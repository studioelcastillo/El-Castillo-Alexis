-- Tenant hardening for multi-studio isolation.
-- Run after schema.sql, legacy alignment, schema_extensions.sql and configure_rls.sql.

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_app_std_id()
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT std_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_access_studio(p_std_id INT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_std_id IS NOT NULL
    AND (
      public.is_super_admin()
      OR p_std_id = public.current_app_std_id()
      OR EXISTS (
        SELECT 1
        FROM public.studios s
        WHERE s.std_id = p_std_id
          AND s.user_id_owner = public.current_app_user_id()
      )
      OR EXISTS (
        SELECT 1
        FROM public.studios s
        WHERE s.std_id = p_std_id
          AND s.parent_std_id = public.current_app_std_id()
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_setting(p_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_std_id INT;
  v_user_id INT;
  v_role_id INT;
BEGIN
  IF public.is_super_admin() THEN
    RETURN true;
  END IF;

  IF p_key IS NULL OR p_key = '' THEN
    RETURN false;
  END IF;

  IF p_key LIKE 'studio:%:%' THEN
    BEGIN
      v_std_id := split_part(p_key, ':', 2)::INT;
      RETURN public.can_access_studio(v_std_id);
    EXCEPTION WHEN others THEN
      RETURN false;
    END;
  END IF;

  IF p_key LIKE 'chat_settings:%' OR p_key LIKE 'chat_blocked:%' OR p_key LIKE 'wallet:%' OR p_key LIKE 'referral:%' THEN
    BEGIN
      v_user_id := split_part(p_key, ':', 2)::INT;
      RETURN EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.user_id = v_user_id
          AND (
            u.user_id = public.current_app_user_id()
            OR public.can_access_studio(u.std_id)
          )
      );
    EXCEPTION WHEN others THEN
      RETURN false;
    END;
  END IF;

  IF p_key LIKE 'chat_role_defaults:%' THEN
    BEGIN
      v_role_id := split_part(p_key, ':', 2)::INT;
      RETURN EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.auth_user_id = auth.uid()
          AND (u.prof_id = v_role_id OR public.can_access_studio(u.std_id))
      );
    EXCEPTION WHEN others THEN
      RETURN false;
    END;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_tenant_policy(
  p_table_name TEXT,
  p_policy_name TEXT,
  p_using_expr TEXT,
  p_check_expr TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF to_regclass('public.' || p_table_name) IS NULL THEN
    RETURN;
  END IF;

  BEGIN
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS authenticated_full_access ON public.%I', p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_policy_name, p_table_name);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (%s) WITH CHECK (%s)',
      p_policy_name,
      p_table_name,
      p_using_expr,
      COALESCE(p_check_expr, p_using_expr)
    );
  EXCEPTION
    WHEN undefined_table OR undefined_column THEN
      RAISE NOTICE 'Skipping policy % on table % because dependent schema is not available yet.', p_policy_name, p_table_name;
  END;
END;
$$;

-- Add std_id to tables that were effectively global in the UI.
ALTER TABLE IF EXISTS public.system_alerts ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.attendance_daily ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.remote_devices ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.remote_sessions ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.remote_access_policies ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.remote_audit_logs ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.chat_conversations ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.chat_policies ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.chat_templates ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.chat_broadcast_lists ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.chat_broadcast_jobs ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.chat_automations ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.chat_automation_jobs ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.loan_requests ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.installment_plans ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.requisitions ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.financial_rules ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.monetization_platforms ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.monetization_beneficiaries ADD COLUMN IF NOT EXISTS std_id INT REFERENCES public.studios(std_id) ON DELETE SET NULL;

-- Backfill new std_id columns using existing relations when possible.
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL AND to_regclass('public.studios') IS NOT NULL THEN
    UPDATE public.users u
    SET std_id = s.std_id
    FROM public.studios s
    WHERE s.user_id_owner = u.user_id
      AND u.std_id IS NULL;
  END IF;

  IF to_regclass('public.users') IS NOT NULL AND to_regclass('public.studios_models') IS NOT NULL THEN
    UPDATE public.users u
    SET std_id = src.std_id
    FROM (
      SELECT sm.user_id_model AS user_id, MAX(sm.std_id) AS std_id
      FROM public.studios_models sm
      WHERE sm.user_id_model IS NOT NULL
        AND COALESCE(sm.stdmod_active, true) = true
      GROUP BY sm.user_id_model
      HAVING COUNT(DISTINCT sm.std_id) = 1
    ) src
    WHERE u.user_id = src.user_id
      AND u.std_id IS NULL;
  END IF;

  IF to_regclass('public.system_alerts') IS NOT NULL THEN
    UPDATE public.system_alerts sa
    SET std_id = u.std_id
    FROM public.users u
    WHERE sa.subject_user_id = u.user_id
      AND sa.std_id IS NULL;

    UPDATE public.system_alerts sa
    SET std_id = u.std_id
    FROM public.users u
    WHERE sa.resolved_by = u.user_id
      AND sa.std_id IS NULL;
  END IF;

  IF to_regclass('public.attendance_daily') IS NOT NULL THEN
    UPDATE public.attendance_daily ad
    SET std_id = u.std_id
    FROM public.users u
    WHERE ad.user_id = u.user_id
      AND ad.std_id IS NULL;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'attendance_daily'
        AND column_name = 'work_shift_id'
    ) THEN
      UPDATE public.attendance_daily ad
      SET std_id = ws.std_id
      FROM public.work_shifts ws
      WHERE ad.work_shift_id = ws.work_shift_id
        AND ad.std_id IS NULL;
    END IF;
  END IF;

  IF to_regclass('public.remote_sessions') IS NOT NULL AND to_regclass('public.remote_devices') IS NOT NULL THEN
    UPDATE public.remote_sessions rs
    SET std_id = rd.std_id
    FROM public.remote_devices rd
    WHERE rs.remote_device_id = rd.remote_device_id
      AND rs.std_id IS NULL;
  END IF;

  IF to_regclass('public.chat_conversations') IS NOT NULL
     AND to_regclass('public.chat_conversation_members') IS NOT NULL THEN
    UPDATE public.chat_conversations cc
    SET std_id = src.std_id
    FROM (
      SELECT ccm.conversation_id, MAX(u.std_id) AS std_id
      FROM public.chat_conversation_members ccm
      JOIN public.users u ON u.user_id = ccm.user_id
      GROUP BY ccm.conversation_id
    ) src
    WHERE cc.conversation_id = src.conversation_id
      AND cc.std_id IS NULL;
  END IF;

  IF to_regclass('public.chat_broadcast_jobs') IS NOT NULL THEN
    UPDATE public.chat_broadcast_jobs cbj
    SET std_id = u.std_id
    FROM public.users u
    WHERE cbj.created_by = u.user_id
      AND cbj.std_id IS NULL;
  END IF;

  IF to_regclass('public.chat_broadcast_lists') IS NOT NULL THEN
    UPDATE public.chat_broadcast_lists cbl
    SET std_id = u.std_id
    FROM public.users u
    WHERE cbl.created_by = u.user_id
      AND cbl.std_id IS NULL;
  END IF;

  IF to_regclass('public.chat_templates') IS NOT NULL THEN
    UPDATE public.chat_templates ct
    SET std_id = u.std_id
    FROM public.users u
    WHERE ct.created_by = u.user_id
      AND ct.std_id IS NULL;
  END IF;

  IF to_regclass('public.chat_automations') IS NOT NULL THEN
    UPDATE public.chat_automations ca
    SET std_id = u.std_id
    FROM public.users u
    WHERE ca.created_by = u.user_id
      AND ca.std_id IS NULL;
  END IF;

  IF to_regclass('public.chat_automation_jobs') IS NOT NULL
     AND to_regclass('public.chat_automations') IS NOT NULL THEN
    UPDATE public.chat_automation_jobs caj
    SET std_id = ca.std_id
    FROM public.chat_automations ca
    WHERE caj.automation_id = ca.automation_id
      AND caj.std_id IS NULL;
  END IF;

  IF to_regclass('public.loan_requests') IS NOT NULL THEN
    UPDATE public.loan_requests lr
    SET std_id = u.std_id
    FROM public.users u
    WHERE lr.user_id = u.user_id
      AND lr.std_id IS NULL;
  END IF;

  IF to_regclass('public.installment_plans') IS NOT NULL THEN
    UPDATE public.installment_plans ip
    SET std_id = u.std_id
    FROM public.users u
    WHERE ip.user_id = u.user_id
      AND ip.std_id IS NULL;
  END IF;

  IF to_regclass('public.requisitions') IS NOT NULL THEN
    UPDATE public.requisitions r
    SET std_id = u.std_id
    FROM public.users u
    WHERE r.user_id = u.user_id
      AND r.std_id IS NULL;
  END IF;
END $$;

-- Existing rows that still cannot be mapped safely to a studio stay NULL.
-- Those rows remain visible only to super admins until they are attributed.

-- Seed scoped settings from legacy global keys.
INSERT INTO public.settings (set_key, set_value, set_description, created_at, updated_at)
SELECT
  'studio:' || s.std_id || ':' || st.set_key,
  st.set_value,
  COALESCE(st.set_description, 'Scoped migrated setting'),
  COALESCE(st.created_at, NOW()),
  COALESCE(st.updated_at, NOW())
FROM public.settings st
CROSS JOIN public.studios s
WHERE st.set_key IN (
  'subscription_data',
  'subscription_invoices',
  'license_clients',
  'license_revenue_data',
  'global_settings',
  'global_settings_audit',
  'birthday_template',
  'attendance_valuation',
  'photo_availability',
  'photo_restrictions',
  'monetization_token_value'
)
AND NOT EXISTS (
  SELECT 1
  FROM public.settings scoped
  WHERE scoped.set_key = 'studio:' || s.std_id || ':' || st.set_key
);

-- Helper to drop and recreate tenant policies safely.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE 'tenant_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

DROP POLICY IF EXISTS settings_read_app_keys ON public.settings;

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS super_access ON public.users;
DROP POLICY IF EXISTS staff_studio_access ON public.users;
DROP POLICY IF EXISTS self_access ON public.users;
DROP POLICY IF EXISTS admin_full_access ON public.users;

CREATE POLICY admin_full_access ON public.users
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY self_access ON public.users
FOR SELECT TO authenticated
USING (user_id = public.current_app_user_id());

CREATE POLICY tenant_users_access ON public.users
FOR ALL TO authenticated
USING (
  user_id = public.current_app_user_id()
  OR public.can_access_studio(std_id)
)
WITH CHECK (
  user_id = public.current_app_user_id()
  OR public.can_access_studio(std_id)
);

ALTER TABLE IF EXISTS public.studios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS studio_owner_access ON public.studios;
DROP POLICY IF EXISTS admin_full_access ON public.studios;

CREATE POLICY admin_full_access ON public.studios
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY tenant_studios_access ON public.studios
FOR ALL TO authenticated
USING (
  user_id_owner = public.current_app_user_id()
  OR std_id = public.current_app_std_id()
  OR parent_std_id = public.current_app_std_id()
)
WITH CHECK (
  user_id_owner = public.current_app_user_id()
  OR std_id = public.current_app_std_id()
  OR parent_std_id = public.current_app_std_id()
);

DROP POLICY IF EXISTS hierarchical_payments ON public.payments;

SELECT public.ensure_tenant_policy('settings', 'tenant_settings_access', 'public.can_access_setting(set_key)');
SELECT public.ensure_tenant_policy('room_types', 'tenant_room_types_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('system_alerts', 'tenant_system_alerts_access', 'public.can_access_studio(std_id)');

SELECT public.ensure_tenant_policy('studios_accounts', 'tenant_studios_accounts_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('studios_rooms', 'tenant_studios_rooms_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('studios_shifts', 'tenant_studios_shifts_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('studios_models', 'tenant_studios_models_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('models_accounts', 'tenant_models_accounts_access', 'EXISTS (SELECT 1 FROM public.studios_models sm WHERE sm.stdmod_id = models_accounts.stdmod_id AND public.can_access_studio(sm.std_id))');
SELECT public.ensure_tenant_policy('models_goals', 'tenant_models_goals_access', 'EXISTS (SELECT 1 FROM public.studios_models sm WHERE sm.stdmod_id = models_goals.stdmod_id AND public.can_access_studio(sm.std_id))');
SELECT public.ensure_tenant_policy('models_transactions', 'tenant_models_transactions_access', 'EXISTS (SELECT 1 FROM public.studios_models sm WHERE sm.stdmod_id = models_transactions.stdmod_id AND public.can_access_studio(sm.std_id))');
SELECT public.ensure_tenant_policy('models_streams', 'tenant_models_streams_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('commissions', 'tenant_commissions_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('bank_accounts', 'tenant_bank_accounts_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('payments', 'tenant_payments_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('paysheets', 'tenant_paysheets_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('transactions', 'tenant_transactions_access', 'EXISTS (SELECT 1 FROM public.users u WHERE u.user_id = transactions.user_id AND public.can_access_studio(u.std_id))');
SELECT public.ensure_tenant_policy('payroll_periods', 'tenant_payroll_periods_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('payroll_concepts', 'tenant_payroll_concepts_access', 'EXISTS (SELECT 1 FROM public.payroll_periods pp WHERE pp.payroll_period_id = payroll_concepts.payroll_period_id AND public.can_access_studio(pp.std_id))');
SELECT public.ensure_tenant_policy('payroll_transactions', 'tenant_payroll_transactions_access', 'EXISTS (SELECT 1 FROM public.payroll_periods pp WHERE pp.payroll_period_id = payroll_transactions.payroll_period_id AND public.can_access_studio(pp.std_id))');
SELECT public.ensure_tenant_policy('attendance_devices', 'tenant_attendance_devices_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('attendance_employees', 'tenant_attendance_employees_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('attendance_transactions', 'tenant_attendance_transactions_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('attendance_daily', 'tenant_attendance_daily_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('work_shifts', 'tenant_work_shifts_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('products', 'tenant_products_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('cost_centers', 'tenant_cost_centers_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('store_orders', 'tenant_store_orders_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('loan_requests', 'tenant_loan_requests_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('installment_plans', 'tenant_installment_plans_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('requisitions', 'tenant_requisitions_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('financial_rules', 'tenant_financial_rules_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('monetization_platforms', 'tenant_monetization_platforms_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('monetization_beneficiaries', 'tenant_monetization_beneficiaries_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('monetization_liquidations', 'tenant_monetization_liquidations_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('photo_requests', 'tenant_photo_requests_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('photo_calendar_events', 'tenant_photo_calendar_events_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('content_platforms', 'tenant_content_platforms_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('content_assets', 'tenant_content_assets_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('content_tasks', 'tenant_content_tasks_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('setup_commissions', 'tenant_setup_commissions_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('shift_monitor_schedules', 'tenant_shift_monitor_schedules_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('shift_model_assignments', 'tenant_shift_model_assignments_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('shift_settings', 'tenant_shift_settings_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('remote_devices', 'tenant_remote_devices_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('remote_sessions', 'tenant_remote_sessions_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('remote_access_policies', 'tenant_remote_access_policies_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('remote_audit_logs', 'tenant_remote_audit_logs_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('chat_profiles', 'tenant_chat_profiles_access', 'EXISTS (SELECT 1 FROM public.users u WHERE u.user_id = chat_profiles.user_id AND public.can_access_studio(u.std_id))');
SELECT public.ensure_tenant_policy('chat_conversations', 'tenant_chat_conversations_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('chat_policies', 'tenant_chat_policies_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('chat_templates', 'tenant_chat_templates_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('chat_broadcast_lists', 'tenant_chat_broadcast_lists_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('chat_broadcast_jobs', 'tenant_chat_broadcast_jobs_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('chat_automations', 'tenant_chat_automations_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('chat_automation_jobs', 'tenant_chat_automation_jobs_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('room_assignments', 'tenant_room_assignments_access', 'public.can_access_studio(std_id)');
SELECT public.ensure_tenant_policy('warehouse_items', 'tenant_warehouse_items_access', 'public.can_access_studio(std_id)');

SELECT public.ensure_tenant_policy('payment_files', 'tenant_payment_files_access', 'EXISTS (SELECT 1 FROM public.payments p WHERE p.pay_id = payment_files.pay_id AND public.can_access_studio(p.std_id))');
SELECT public.ensure_tenant_policy('models_streams_files', 'tenant_models_streams_files_access', 'EXISTS (SELECT 1 FROM public.models_streams ms WHERE ms.modstrfile_id = models_streams_files.modstrfile_id AND public.can_access_studio(ms.std_id))', 'EXISTS (SELECT 1 FROM public.users u WHERE u.user_id = models_streams_files.created_by AND public.can_access_studio(u.std_id))');
SELECT public.ensure_tenant_policy('models_streams_customers', 'tenant_models_streams_customers_access', 'EXISTS (SELECT 1 FROM public.models_streams ms WHERE ms.modstr_id = models_streams_customers.modstr_id AND public.can_access_studio(ms.std_id))');
SELECT public.ensure_tenant_policy('photo_assets', 'tenant_photo_assets_access', 'EXISTS (SELECT 1 FROM public.photo_requests pr WHERE pr.photo_req_id = photo_assets.photo_req_id AND public.can_access_studio(pr.std_id))');
SELECT public.ensure_tenant_policy('photo_ratings', 'tenant_photo_ratings_access', 'EXISTS (SELECT 1 FROM public.photo_requests pr WHERE pr.photo_req_id = photo_ratings.photo_req_id AND public.can_access_studio(pr.std_id))');
SELECT public.ensure_tenant_policy('product_images', 'tenant_product_images_access', 'EXISTS (SELECT 1 FROM public.products p WHERE p.prod_id = product_images.prod_id AND public.can_access_studio(p.std_id))');
SELECT public.ensure_tenant_policy('product_variants', 'tenant_product_variants_access', 'EXISTS (SELECT 1 FROM public.products p WHERE p.prod_id = product_variants.prod_id AND public.can_access_studio(p.std_id))');
SELECT public.ensure_tenant_policy('inventory_lots', 'tenant_inventory_lots_access', 'EXISTS (SELECT 1 FROM public.product_variants pv JOIN public.products p ON p.prod_id = pv.prod_id WHERE pv.variant_id = inventory_lots.variant_id AND public.can_access_studio(p.std_id))');
SELECT public.ensure_tenant_policy('inventory_movements', 'tenant_inventory_movements_access', 'EXISTS (SELECT 1 FROM public.product_variants pv JOIN public.products p ON p.prod_id = pv.prod_id WHERE pv.variant_id = inventory_movements.variant_id AND public.can_access_studio(p.std_id))');
SELECT public.ensure_tenant_policy('store_order_items', 'tenant_store_order_items_access', 'EXISTS (SELECT 1 FROM public.store_orders so WHERE so.order_id = store_order_items.order_id AND public.can_access_studio(so.std_id))');
SELECT public.ensure_tenant_policy('warehouse_movements', 'tenant_warehouse_movements_access', 'EXISTS (SELECT 1 FROM public.warehouse_items wi WHERE wi.warehouse_item_id = warehouse_movements.warehouse_item_id AND public.can_access_studio(wi.std_id))');
SELECT public.ensure_tenant_policy('room_inventory', 'tenant_room_inventory_access', 'EXISTS (SELECT 1 FROM public.studios_rooms sr WHERE sr.stdroom_id = room_inventory.stdroom_id AND public.can_access_studio(sr.std_id))');
SELECT public.ensure_tenant_policy('room_tickets', 'tenant_room_tickets_access', 'EXISTS (SELECT 1 FROM public.studios_rooms sr WHERE sr.stdroom_id = room_tickets.stdroom_id AND public.can_access_studio(sr.std_id))');
SELECT public.ensure_tenant_policy('room_ticket_items', 'tenant_room_ticket_items_access', 'EXISTS (SELECT 1 FROM public.room_tickets rt JOIN public.studios_rooms sr ON sr.stdroom_id = rt.stdroom_id WHERE rt.room_ticket_id = room_ticket_items.room_ticket_id AND public.can_access_studio(sr.std_id))');
SELECT public.ensure_tenant_policy('chat_conversation_members', 'tenant_chat_members_access', 'EXISTS (SELECT 1 FROM public.chat_conversations cc WHERE cc.conversation_id = chat_conversation_members.conversation_id AND public.can_access_studio(cc.std_id))');
SELECT public.ensure_tenant_policy('chat_messages', 'tenant_chat_messages_access', 'EXISTS (SELECT 1 FROM public.chat_conversations cc WHERE cc.conversation_id = chat_messages.conversation_id AND public.can_access_studio(cc.std_id))');
SELECT public.ensure_tenant_policy('setup_commissions_item', 'tenant_setup_commissions_item_access', 'EXISTS (SELECT 1 FROM public.setup_commissions sc WHERE sc.setcomm_id = setup_commissions_item.setcomm_id AND public.can_access_studio(sc.std_id))');
SELECT public.ensure_tenant_policy('monetization_liquidation_items', 'tenant_monetization_liquidation_items_access', 'EXISTS (SELECT 1 FROM public.monetization_liquidations ml WHERE ml.liquidation_id = monetization_liquidation_items.liquidation_id AND public.can_access_studio(ml.std_id))');
SELECT public.ensure_tenant_policy('monetization_liquidation_discounts', 'tenant_monetization_liquidation_discounts_access', 'EXISTS (SELECT 1 FROM public.monetization_liquidations ml WHERE ml.liquidation_id = monetization_liquidation_discounts.liquidation_id AND public.can_access_studio(ml.std_id))');
SELECT public.ensure_tenant_policy('monetization_liquidation_retentions', 'tenant_monetization_liquidation_retentions_access', 'EXISTS (SELECT 1 FROM public.monetization_liquidations ml WHERE ml.liquidation_id = monetization_liquidation_retentions.liquidation_id AND public.can_access_studio(ml.std_id))');
