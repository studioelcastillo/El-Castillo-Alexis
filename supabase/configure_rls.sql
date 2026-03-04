-- ==========================================================
-- EL CASTILLO GROUP SAS — Configuración de RLS
-- Ejecutar en: Dashboard Supabase > SQL Editor
-- Proyecto: wukvaemawvjavwqocxyb (El_Castillo_BaseDatos)
-- ==========================================================
-- ESTRATEGIA: Permitir acceso completo a usuarios autenticados.
-- Esto replica el comportamiento del API Laravel original
-- donde la autenticación era el único control de acceso.
-- ==========================================================

-- ════════════════════════════════════════════════════════════
-- PASO 0: CREAR TABLAS FALTANTES (Módulo Nómina/Payroll)
-- ════════════════════════════════════════════════════════════

-- Períodos de nómina (payroll_periods)
CREATE TABLE IF NOT EXISTS payroll_periods (
  payroll_period_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE CASCADE,
  payroll_period_start_date DATE NOT NULL,
  payroll_period_end_date DATE NOT NULL,
  payroll_period_state VARCHAR(20) NOT NULL DEFAULT 'ABIERTO', -- ABIERTO, CERRADO, LIQUIDADO
  payroll_period_interval VARCHAR(20) NOT NULL DEFAULT 'MENSUAL', -- SEMANAL, QUINCENAL, MENSUAL
  payroll_period_smmlv NUMERIC(14,2) DEFAULT 1300000,
  is_auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conceptos de nómina (horas extras, deducciones adicionales)
CREATE TABLE IF NOT EXISTS payroll_concepts (
  payroll_concept_id SERIAL PRIMARY KEY,
  payroll_period_id INT REFERENCES payroll_periods(payroll_period_id) ON DELETE CASCADE,
  stdmod_id INT REFERENCES studios_models(stdmod_id) ON DELETE CASCADE,
  concept_type VARCHAR(50) NOT NULL, -- EXTRA_HOUR_DIURNA, EXTRA_HOUR_NOCTURNA, etc.
  concept_description TEXT,
  concept_hours NUMERIC(8,2) DEFAULT 0,
  concept_hourly_rate NUMERIC(14,2) DEFAULT 0,
  concept_surcharge_percentage NUMERIC(8,2) DEFAULT 0,
  concept_total NUMERIC(14,2) DEFAULT 0,
  commission_periods JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transacciones de nómina (resultado de liquidación)
CREATE TABLE IF NOT EXISTS payroll_transactions (
  payroll_trans_id SERIAL PRIMARY KEY,
  payroll_period_id INT REFERENCES payroll_periods(payroll_period_id) ON DELETE CASCADE,
  stdmod_id INT REFERENCES studios_models(stdmod_id) ON DELETE CASCADE,
  employee_id INT REFERENCES users(user_id),
  employee_name VARCHAR(500),
  total_salary NUMERIC(14,2) DEFAULT 0,
  commissions NUMERIC(14,2) DEFAULT 0,
  total_deducciones NUMERIC(14,2) DEFAULT 0,
  total_neto NUMERIC(14,2) DEFAULT 0,
  prestaciones JSONB DEFAULT '{}'::jsonb,
  social_security JSONB DEFAULT '{}'::jsonb,
  parafiscales JSONB DEFAULT '{}'::jsonb,
  salary_composition JSONB DEFAULT '[]'::jsonb,
  commission_details JSONB DEFAULT '[]'::jsonb,
  commission_periods JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════
-- PASO 1: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- (evitar conflictos con policies previas del schema.sql)
-- ════════════════════════════════════════════════════════════

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- PASO 2: HABILITAR RLS EN TODAS LAS TABLAS PÚBLICAS
-- ════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users_permissions2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS terceros ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS studios_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS studios_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS studios_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS studios_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS models_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS models_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS models_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS models_streams_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS models_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS models_streams_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS paysheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payroll_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payroll_transactions ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════
-- PASO 3: CREAR POLÍTICA DE ACCESO COMPLETO PARA AUTENTICADOS
-- Cada tabla obtiene una política que permite SELECT, INSERT,
-- UPDATE, DELETE a cualquier usuario con sesión activa.
-- ════════════════════════════════════════════════════════════

-- ── Configuración y Catálogos ──────────────────────────────

CREATE POLICY "authenticated_full_access" ON profiles
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON users
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON users_permissions2
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON accounts
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON settings
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON locations
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON categories
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON transactions_types
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON exchange_rates
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON periods
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON products
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON terceros
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Estudios ───────────────────────────────────────────────

CREATE POLICY "authenticated_full_access" ON studios
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON studios_accounts
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON studios_rooms
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON studios_shifts
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON studios_models
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Modelos ────────────────────────────────────────────────

CREATE POLICY "authenticated_full_access" ON models_accounts
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON models_goals
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON models_transactions
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON models_streams_files
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON models_streams
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON models_streams_customers
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Comisiones y Pagos ─────────────────────────────────────

CREATE POLICY "authenticated_full_access" ON commissions
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON bank_accounts
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON payments
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON payment_files
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON paysheets
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Transacciones ──────────────────────────────────────────

CREATE POLICY "authenticated_full_access" ON transactions
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Notificaciones y Peticiones ────────────────────────────

CREATE POLICY "authenticated_full_access" ON notifications
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON petitions
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Logs y Auditoría ───────────────────────────────────────

CREATE POLICY "authenticated_full_access" ON logs
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON login_history
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON payroll_periods
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON payroll_concepts
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON payroll_transactions
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════
-- PASO 4: CONFIGURAR STORAGE BUCKET
-- ════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('el-castillo', 'el-castillo', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir a usuarios autenticados subir archivos
CREATE POLICY "authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'el-castillo');

-- Permitir a usuarios autenticados actualizar sus archivos
CREATE POLICY "authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'el-castillo');

-- Permitir lectura pública de archivos del bucket
CREATE POLICY "public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'el-castillo');

-- Permitir a autenticados eliminar archivos
CREATE POLICY "authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'el-castillo');

-- ════════════════════════════════════════════════════════════
-- VERIFICACIÓN: Consultar que todas las tablas tienen RLS
-- ════════════════════════════════════════════════════════════

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
