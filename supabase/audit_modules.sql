WITH target(table_name) AS (
  VALUES
    -- Nomina / Payroll
    ('payroll_periods'),
    ('payroll_concepts'),
    ('payroll_transactions'),
    ('paysheets'),

    -- Tienda / Inventario
    ('categories'),
    ('products'),
    ('product_variants'),
    ('product_images'),
    ('inventory_lots'),
    ('inventory_movements'),
    ('cost_centers'),
    ('store_orders'),
    ('store_order_items'),
    ('loan_requests'),
    ('installment_plans'),
    ('requisitions'),
    ('financial_rules'),

    -- Pagos / Finanzas
    ('payments'),
    ('payment_files'),
    ('bank_accounts'),
    ('accounts'),
    ('transactions'),
    ('transactions_types'),
    ('exchange_rates'),

    -- Monetizacion
    ('monetization_platforms'),
    ('monetization_beneficiaries'),
    ('monetization_liquidations'),
    ('monetization_liquidation_items'),
    ('monetization_liquidation_discounts'),
    ('monetization_liquidation_retentions'),

    -- Streams / Modelos
    ('models_streams'),
    ('models_accounts'),
    ('models_goals'),
    ('models_transactions'),
    ('models_streams_files'),
    ('models_streams_customers'),
    ('periods'),

    -- Room control / Inventario interno
    ('room_types'),
    ('room_assignments'),
    ('room_inventory'),
    ('room_tickets'),
    ('room_ticket_items'),
    ('warehouse_items'),
    ('warehouse_movements'),
    ('system_alerts'),

    -- Foto / Multimedia
    ('photo_requests'),
    ('photo_assets'),
    ('photo_calendar_events'),
    ('photo_ratings'),

    -- Contenido
    ('content_platforms'),
    ('content_assets'),
    ('content_tasks')
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
SELECT table_name, exists, rls_enabled, policies
FROM table_info
ORDER BY table_name;
