-- Align legacy AWS dump tables with the current Supabase app schema.
-- Run after `schema.sql` and `legacy_schema_missing.sql`.

-- Ensure the settings table exists for modules that persist JSON config.
CREATE TABLE IF NOT EXISTS settings (
  set_id SERIAL PRIMARY KEY,
  set_key VARCHAR(100) NOT NULL UNIQUE,
  set_value TEXT,
  set_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the settings keys that the dashboard expects even if the legacy dump does not provide them.
INSERT INTO settings (set_key, set_value, set_description)
VALUES
  ('monetization_token_value', '0', 'Valor del token para monetizacion'),
  ('license_clients', '[]', 'Clientes de licencias'),
  ('license_revenue_data', '[]', 'Datos de ingresos de licencias'),
  ('subscription_data', 'null', 'Datos de suscripcion'),
  ('subscription_invoices', '[]', 'Facturas de suscripcion'),
  ('global_settings', '{}', 'Configuracion global'),
  ('global_settings_audit', '[]', 'Auditoria de configuracion global'),
  ('birthday_template', 'null', 'Plantilla de cumpleanos'),
  ('photo_availability', '[]', 'Disponibilidad de fotografia'),
  ('photo_restrictions', '{}', 'Restricciones de fotografia'),
  ('attendance_valuation', '{}', 'Configuracion de valoracion de asistencia')
ON CONFLICT (set_key) DO NOTHING;

DO $$
BEGIN
  IF to_regclass('public.accounting_accounts') IS NOT NULL THEN
    INSERT INTO public.accounts (
      accacc_id,
      accacc_name,
      accacc_number,
      created_at,
      updated_at
    )
    SELECT
      aa.accacc_id,
      aa.accacc_name,
      aa.accacc_number,
      COALESCE(aa.created_at::timestamptz, NOW()),
      COALESCE(aa.updated_at::timestamptz, NOW())
    FROM public.accounting_accounts aa
    ON CONFLICT (accacc_id) DO UPDATE SET
      accacc_name = EXCLUDED.accacc_name,
      accacc_number = EXCLUDED.accacc_number,
      updated_at = EXCLUDED.updated_at;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.banks_accounts') IS NOT NULL THEN
    INSERT INTO public.bank_accounts (
      bacc_id,
      std_id,
      bacc_bank,
      bacc_type,
      bacc_number,
      bacc_owner_name,
      bacc_owner_id,
      bacc_active,
      created_at,
      updated_at
    )
    SELECT
      ba.bankacc_id,
      ba.std_id,
      ba.bankacc_entity,
      ba.bankacc_type,
      ba.bankacc_number,
      ba.bankacc_beneficiary_name,
      ba.bankacc_beneficiary_document,
      CASE WHEN ba.deleted_at IS NULL THEN true ELSE false END,
      COALESCE(ba.created_at::timestamptz, NOW()),
      COALESCE(ba.updated_at::timestamptz, NOW())
    FROM public.banks_accounts ba
    ON CONFLICT (bacc_id) DO UPDATE SET
      std_id = EXCLUDED.std_id,
      bacc_bank = EXCLUDED.bacc_bank,
      bacc_type = EXCLUDED.bacc_type,
      bacc_number = EXCLUDED.bacc_number,
      bacc_owner_name = EXCLUDED.bacc_owner_name,
      bacc_owner_id = EXCLUDED.bacc_owner_id,
      bacc_active = EXCLUDED.bacc_active,
      updated_at = EXCLUDED.updated_at;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.exchanges_rates') IS NOT NULL THEN
    INSERT INTO public.exchange_rates (
      exrate_date,
      exrate_usd,
      exrate_eur,
      exrate_cop,
      created_at
    )
    SELECT
      grouped.exrate_date,
      grouped.exrate_usd,
      grouped.exrate_eur,
      1,
      grouped.created_at
    FROM (
      SELECT
        er.exrate_date,
        MAX(CASE WHEN UPPER(er.exrate_from) = 'USD' AND UPPER(er.exrate_to) = 'COP' THEN er.exrate_rate END) AS exrate_usd,
        MAX(CASE WHEN UPPER(er.exrate_from) = 'EUR' AND UPPER(er.exrate_to) = 'COP' THEN er.exrate_rate END) AS exrate_eur,
        COALESCE(MIN(er.created_at)::timestamptz, NOW()) AS created_at
      FROM public.exchanges_rates er
      WHERE er.deleted_at IS NULL
      GROUP BY er.exrate_date
    ) grouped
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.exchange_rates current_rates
      WHERE current_rates.exrate_date = grouped.exrate_date
    );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.payments_files') IS NOT NULL AND to_regclass('public.payments') IS NOT NULL THEN
    INSERT INTO public.payment_files (
      payf_id,
      pay_id,
      payf_name,
      payf_url,
      payf_type,
      payf_total,
      created_at
    )
    SELECT
      mapped.payfile_id,
      mapped.pay_id,
      mapped.payfile_description,
      mapped.payfile_filename,
      mapped.payfile_template,
      mapped.payfile_total,
      mapped.created_at
    FROM (
      SELECT
        pf.payfile_id,
        MIN(p.pay_id) AS pay_id,
        pf.payfile_description,
        pf.payfile_filename,
        pf.payfile_template,
        pf.payfile_total,
        COALESCE(pf.created_at::timestamptz, NOW()) AS created_at
      FROM public.payments_files pf
      LEFT JOIN public.payments p ON p.payfile_id = pf.payfile_id
      WHERE pf.deleted_at IS NULL
      GROUP BY
        pf.payfile_id,
        pf.payfile_description,
        pf.payfile_filename,
        pf.payfile_template,
        pf.payfile_total,
        pf.created_at
    ) mapped
    WHERE mapped.pay_id IS NOT NULL
    ON CONFLICT (payf_id) DO UPDATE SET
      pay_id = EXCLUDED.pay_id,
      payf_name = EXCLUDED.payf_name,
      payf_url = EXCLUDED.payf_url,
      payf_type = EXCLUDED.payf_type,
      payf_total = EXCLUDED.payf_total;
  END IF;
END $$;

DO $$
DECLARE
  seq_name text;
BEGIN
  seq_name := pg_get_serial_sequence('public.accounts', 'accacc_id');
  IF seq_name IS NOT NULL THEN
    EXECUTE format(
      'SELECT setval(%L, COALESCE((SELECT MAX(accacc_id) FROM public.accounts), 1), true)',
      seq_name
    );
  END IF;

  seq_name := pg_get_serial_sequence('public.bank_accounts', 'bacc_id');
  IF seq_name IS NOT NULL THEN
    EXECUTE format(
      'SELECT setval(%L, COALESCE((SELECT MAX(bacc_id) FROM public.bank_accounts), 1), true)',
      seq_name
    );
  END IF;

  seq_name := pg_get_serial_sequence('public.payment_files', 'payf_id');
  IF seq_name IS NOT NULL THEN
    EXECUTE format(
      'SELECT setval(%L, COALESCE((SELECT MAX(payf_id) FROM public.payment_files), 1), true)',
      seq_name
    );
  END IF;

  seq_name := pg_get_serial_sequence('public.settings', 'set_id');
  IF seq_name IS NOT NULL THEN
    EXECUTE format(
      'SELECT setval(%L, COALESCE((SELECT MAX(set_id) FROM public.settings), 1), true)',
      seq_name
    );
  END IF;
END $$;
