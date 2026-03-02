-- ==========================================================
-- EL CASTILLO GROUP SAS — Supabase Database Schema
-- Generado automáticamente desde los servicios del proyecto
-- URL: https://ysorlqfwqccsgxxkpzdx.supabase.co
-- ==========================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- TABLAS DE CONFIGURACIÓN Y CATÁLOGOS
-- ==========================================================

-- Perfiles de usuario (roles)
CREATE TABLE IF NOT EXISTS profiles (
  prof_id SERIAL PRIMARY KEY,
  prof_name VARCHAR(100) NOT NULL UNIQUE,
  prof_description TEXT,
  prof_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO profiles (prof_id, prof_name, prof_description) VALUES
  (1, 'SUPER_ADMIN', 'Super Administrador'),
  (2, 'STUDIO_OWNER', 'Dueño de Estudio'),
  (3, 'ADMIN', 'Administrador'),
  (4, 'MODEL', 'Modelo'),
  (5, 'MODEL_SATELITE', 'Modelo Satélite'),
  (6, 'RRHH', 'Recursos Humanos'),
  (7, 'MONITOR', 'Monitor'),
  (8, 'COORDINATOR', 'Coordinador'),
  (11, 'ACCOUNTANT', 'Contador')
ON CONFLICT (prof_id) DO NOTHING;

-- Usuarios extendidos (complementa auth.users de Supabase)
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prof_id INT NOT NULL REFERENCES profiles(prof_id),
  std_id INT, -- Referencia al estudio si es staff (Admin, Monitor, etc.)
  user_name VARCHAR(100) NOT NULL,
  user_surname VARCHAR(100) NOT NULL,
  user_email VARCHAR(200) UNIQUE,
  user_identification VARCHAR(50),
  user_phone VARCHAR(50),
  user_birthdate DATE,
  user_address TEXT,
  user_photo_url TEXT,
  user_active BOOLEAN DEFAULT true,
  user_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint circular después de crear la tabla studios
-- ALTER TABLE users ADD CONSTRAINT fk_user_std FOREIGN KEY (std_id) REFERENCES studios(std_id);

-- Configuración global
CREATE TABLE IF NOT EXISTS settings (
  set_id SERIAL PRIMARY KEY,
  set_key VARCHAR(100) NOT NULL UNIQUE,
  set_value TEXT,
  set_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ubicaciones (países, departamentos, ciudades)
CREATE TABLE IF NOT EXISTS locations (
  loc_id SERIAL PRIMARY KEY,
  loc_country VARCHAR(100),
  loc_department VARCHAR(100),
  loc_city VARCHAR(100),
  loc_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorías
CREATE TABLE IF NOT EXISTS categories (
  cat_id SERIAL PRIMARY KEY,
  cat_name VARCHAR(150) NOT NULL,
  cat_description TEXT,
  cat_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tipos de transacción
CREATE TABLE IF NOT EXISTS transaction_types (
  ttype_id SERIAL PRIMARY KEY,
  ttype_name VARCHAR(150) NOT NULL,
  ttype_description TEXT,
  ttype_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasas de cambio
CREATE TABLE IF NOT EXISTS exchange_rates (
  exrate_id SERIAL PRIMARY KEY,
  exrate_date DATE NOT NULL,
  exrate_usd NUMERIC(14,4),
  exrate_eur NUMERIC(14,4),
  exrate_cop NUMERIC(14,4) DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Periodos de liquidación
CREATE TABLE IF NOT EXISTS periods (
  per_id SERIAL PRIMARY KEY,
  per_name VARCHAR(150) NOT NULL,
  per_start_date DATE NOT NULL,
  per_end_date DATE NOT NULL,
  per_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productos
CREATE TABLE IF NOT EXISTS products (
  prod_id SERIAL PRIMARY KEY,
  prod_name VARCHAR(200) NOT NULL,
  prod_description TEXT,
  prod_price NUMERIC(14,2),
  prod_currency VARCHAR(10) DEFAULT 'USD',
  prod_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Terceros (Otros entes: proveedores, clientes externos, etc.)
CREATE TABLE IF NOT EXISTS terceros (
  ter_id SERIAL PRIMARY KEY,
  ter_name VARCHAR(255) NOT NULL,
  ter_identification VARCHAR(50),
  ter_type VARCHAR(50), -- PERSONA, EMPRESA
  ter_email VARCHAR(200),
  ter_phone VARCHAR(50),
  ter_address TEXT,
  ter_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- ESTUDIOS (STUDIOS)
-- ==========================================================

CREATE TABLE IF NOT EXISTS studios (
  std_id SERIAL PRIMARY KEY,
  owner_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  parent_std_id INT REFERENCES studios(std_id), -- Soporte para Sedes/Sub-estudios
  std_name VARCHAR(200) NOT NULL,
  std_description TEXT,
  std_address TEXT,
  loc_id INT REFERENCES locations(loc_id),
  std_phone VARCHAR(50),
  std_email VARCHAR(200),
  std_photo_url TEXT,
  std_active BOOLEAN DEFAULT true,
  std_commission_pct NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ahora sí podemos agregar el FK a users
ALTER TABLE users ADD CONSTRAINT fk_user_std FOREIGN KEY (std_id) REFERENCES studios(std_id) ON DELETE SET NULL;

-- Cuentas del estudio (para pagos y liquidaciones)
CREATE TABLE IF NOT EXISTS studio_accounts (
  stdacc_id SERIAL PRIMARY KEY,
  std_id INT NOT NULL REFERENCES studios(std_id) ON DELETE CASCADE,
  stdacc_name VARCHAR(200),
  stdacc_type VARCHAR(50),  -- BANCARIA, VIRTUAL, etc.
  stdacc_number VARCHAR(100),
  stdacc_bank VARCHAR(200),
  stdacc_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cuartos del estudio
CREATE TABLE IF NOT EXISTS studio_rooms (
  room_id SERIAL PRIMARY KEY,
  std_id INT NOT NULL REFERENCES studios(std_id) ON DELETE CASCADE,
  room_name VARCHAR(100) NOT NULL,
  room_description TEXT,
  room_active BOOLEAN DEFAULT true,
  room_occupied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turnos del estudio
CREATE TABLE IF NOT EXISTS studio_shifts (
  shift_id SERIAL PRIMARY KEY,
  std_id INT NOT NULL REFERENCES studios(std_id) ON DELETE CASCADE,
  shift_name VARCHAR(100) NOT NULL,
  shift_start_time TIME,
  shift_end_time TIME,
  shift_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- MODELOS
-- ==========================================================

-- Relación modelo ↔ estudio
CREATE TABLE IF NOT EXISTS studio_models (
  stdmod_id SERIAL PRIMARY KEY,
  std_id INT NOT NULL REFERENCES studios(std_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  room_id INT REFERENCES studio_rooms(room_id),
  shift_id INT REFERENCES studio_shifts(shift_id),
  stdmod_commission_type VARCHAR(50) DEFAULT 'PRESENCIAL',  -- PRESENCIAL, SATELITE
  stdmod_commission_pct NUMERIC(5,2) DEFAULT 0,
  stdmod_active BOOLEAN DEFAULT true,
  stdmod_start_date DATE,
  stdmod_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(std_id, user_id)
);

-- Cuentas de la modelo
CREATE TABLE IF NOT EXISTS model_accounts (
  modacc_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  modacc_name VARCHAR(200),
  modacc_type VARCHAR(50),
  modacc_number VARCHAR(100),
  modacc_bank VARCHAR(200),
  modacc_document_url TEXT,
  modacc_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metas de la modelo
CREATE TABLE IF NOT EXISTS model_goals (
  goal_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  std_id INT REFERENCES studios(std_id),
  per_id INT REFERENCES periods(per_id),
  goal_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  goal_currency VARCHAR(10) DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transacciones de la modelo
CREATE TABLE IF NOT EXISTS model_transactions (
  modtrans_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  std_id INT REFERENCES studios(std_id),
  per_id INT REFERENCES periods(per_id),
  modtrans_amount NUMERIC(14,4) NOT NULL,
  modtrans_currency VARCHAR(10) DEFAULT 'USD',
  modtrans_description TEXT,
  modtrans_type VARCHAR(50),
  modtrans_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- STREAMS (SESIONES DE TRANSMISIÓN)
-- ==========================================================

CREATE TABLE IF NOT EXISTS model_streams (
  modstr_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  std_id INT REFERENCES studios(std_id),
  modstr_platform VARCHAR(100),
  modstr_date DATE,
  modstr_start_time TIME,
  modstr_end_time TIME,
  modstr_earnings_usd NUMERIC(14,4) DEFAULT 0,
  modstr_earnings_eur NUMERIC(14,4) DEFAULT 0,
  modstr_tokens INT DEFAULT 0,
  modstr_minutes INT DEFAULT 0,
  modstr_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Archivos de streams (comprobantes, reportes)
CREATE TABLE IF NOT EXISTS model_stream_files (
  modstrf_id SERIAL PRIMARY KEY,
  modstr_id INT NOT NULL REFERENCES model_streams(modstr_id) ON DELETE CASCADE,
  modstrf_name VARCHAR(300),
  modstrf_url TEXT,
  modstrf_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes del stream (fanáticos, miembros)
CREATE TABLE IF NOT EXISTS model_stream_customers (
  modstrc_id SERIAL PRIMARY KEY,
  modstr_id INT NOT NULL REFERENCES model_streams(modstr_id) ON DELETE CASCADE,
  modstrc_username VARCHAR(200),
  modstrc_platform VARCHAR(100),
  modstrc_tokens INT DEFAULT 0,
  modstrc_amount NUMERIC(14,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- COMISIONES Y PAGOS
-- ==========================================================

-- Configuración de comisiones
CREATE TABLE IF NOT EXISTS commissions (
  com_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id),
  user_id UUID REFERENCES users(user_id),
  com_type VARCHAR(50),  -- STUDIO, MODEL, MONITOR
  com_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  com_fixed_amount NUMERIC(14,2) DEFAULT 0,
  com_currency VARCHAR(10) DEFAULT 'USD',
  com_active BOOLEAN DEFAULT true,
  per_id INT REFERENCES periods(per_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cuentas bancarias (para recibir pagos)
CREATE TABLE IF NOT EXISTS bank_accounts (
  bacc_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  std_id INT REFERENCES studios(std_id),
  bacc_bank VARCHAR(200) NOT NULL,
  bacc_type VARCHAR(50),   -- AHORROS, CORRIENTE
  bacc_number VARCHAR(100) NOT NULL,
  bacc_owner_name VARCHAR(200),
  bacc_owner_id VARCHAR(50),
  bacc_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pagos (liquidaciones)
CREATE TABLE IF NOT EXISTS payments (
  pay_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  std_id INT REFERENCES studios(std_id),
  per_id INT REFERENCES periods(per_id),
  pay_amount NUMERIC(14,4) NOT NULL,
  pay_currency VARCHAR(10) DEFAULT 'COP',
  pay_status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, PAID, CANCELLED
  pay_date DATE,
  pay_notes TEXT,
  pay_exchange_rate NUMERIC(14,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Archivos adjuntos a pagos (comprobantes)
CREATE TABLE IF NOT EXISTS payment_files (
  payf_id SERIAL PRIMARY KEY,
  pay_id INT NOT NULL REFERENCES payments(pay_id) ON DELETE CASCADE,
  payf_name VARCHAR(300),
  payf_url TEXT,
  payf_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Planillas de pago (paysheets)
CREATE TABLE IF NOT EXISTS paysheets (
  paysh_id SERIAL PRIMARY KEY,
  std_id INT NOT NULL REFERENCES studios(std_id),
  per_id INT NOT NULL REFERENCES periods(per_id),
  paysh_total_usd NUMERIC(14,4) DEFAULT 0,
  paysh_total_eur NUMERIC(14,4) DEFAULT 0,
  paysh_total_cop NUMERIC(14,2) DEFAULT 0,
  paysh_status VARCHAR(50) DEFAULT 'DRAFT',
  paysh_notes TEXT,
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- TRANSACCIONES CONTABLES
-- ==========================================================

CREATE TABLE IF NOT EXISTS transactions (
  trans_id SERIAL PRIMARY KEY,
  ttype_id INT REFERENCES transaction_types(ttype_id),
  cat_id INT REFERENCES categories(cat_id),
  user_id UUID REFERENCES users(user_id),
  std_id INT REFERENCES studios(std_id),
  ter_id INT REFERENCES terceros(ter_id), -- Enlace a Terceros
  per_id INT REFERENCES periods(per_id),
  trans_amount NUMERIC(14,4) NOT NULL,
  trans_currency VARCHAR(10) DEFAULT 'COP',
  trans_description TEXT,
  trans_date DATE NOT NULL DEFAULT CURRENT_DATE,
  trans_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- NOTIFICACIONES Y PETICIONES
-- ==========================================================

CREATE TABLE IF NOT EXISTS notifications (
  notif_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  notif_title VARCHAR(300),
  notif_body TEXT,
  notif_type VARCHAR(50),
  notif_read BOOLEAN DEFAULT false,
  notif_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS petitions (
  pet_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id),
  pet_type VARCHAR(100),
  pet_title VARCHAR(300),
  pet_description TEXT,
  pet_status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED
  pet_response TEXT,
  responded_by UUID REFERENCES users(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- LOGS Y AUDITORÍA
-- ==========================================================

CREATE TABLE IF NOT EXISTS logs (
  log_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  log_action VARCHAR(200),
  log_entity VARCHAR(100),
  log_entity_id VARCHAR(100),
  log_old_data JSONB,
  log_new_data JSONB,
  log_ip VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_history (
  lhist_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  lhist_ip VARCHAR(50),
  lhist_device TEXT,
  lhist_success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================================

-- Habilitar RLS en todas las tablas sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE terceros ENABLE ROW LEVEL SECURITY; -- RLS para terceros
ALTER TABLE model_streams ENABLE ROW LEVEL SECURITY;

-- 1. Usuarios de perfil Alto (1, 11) ven TODO
CREATE POLICY "super_access" ON users FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND prof_id IN (1, 11))
);

-- 2. Dueños de Estudio (2) ven su estudio y sedes
CREATE POLICY "studio_owner_access" ON studios FOR ALL TO authenticated USING (
  owner_user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
  OR parent_std_id IN (SELECT std_id FROM studios WHERE owner_user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()))
);

-- 3. Admins (3) y personal de Staff ven data de su propio Estudio
CREATE POLICY "staff_studio_access" ON users FOR ALL TO authenticated USING (
  std_id IN (SELECT std_id FROM users WHERE auth_user_id = auth.uid())
);

-- 4. Usuarios individuales ven su propia fila siempre
CREATE POLICY "self_access" ON users FOR SELECT TO authenticated USING (
  auth_user_id = auth.uid()
);

-- 5. Pagos protegidos por jerarquía
CREATE POLICY "hierarchical_payments" ON payments FOR ALL TO authenticated USING (
  user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()) -- Propio
  OR std_id IN (SELECT std_id FROM users WHERE auth_user_id = auth.uid()) -- Misma sede
  OR std_id IN ( -- Sede descendiente si soy owner
      SELECT std_id FROM studios 
      WHERE owner_user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
      OR parent_std_id IN (SELECT std_id FROM studios WHERE owner_user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()))
  )
);

-- Política: notificaciones propias
CREATE POLICY "notifications_own" ON notifications FOR ALL
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

-- ==========================================================
-- FUNCIONES DE BASE DE DATOS
-- ==========================================================

-- Función: calcular indicadores del Dashboard (SOPORTA JERARQUÍA DE SEDES)
CREATE OR REPLACE FUNCTION get_dashboard_indicators(
  p_per_id INT DEFAULT NULL,
  p_std_id INT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  v_std_ids INT[];
BEGIN
  -- Si se pasa un p_std_id, incluimos sus sedes (hijos directos)
  IF p_std_id IS NOT NULL THEN
    SELECT ARRAY_AGG(std_id) INTO v_std_ids
    FROM studios
    WHERE std_id = p_std_id OR parent_std_id = p_std_id;
  END IF;

  SELECT jsonb_build_object(
    'sum_earnings_usd', COALESCE(SUM(ms.modstr_earnings_usd), 0),
    'sum_earnings_eur', COALESCE(SUM(ms.modstr_earnings_eur), 0),
    'sum_studios', (
        SELECT COUNT(*) FROM studios 
        WHERE std_active = true 
        AND (v_std_ids IS NULL OR std_id = ANY(v_std_ids))
    ),
    'sum_studio_models', (
        SELECT COUNT(*) FROM studio_models 
        WHERE stdmod_active = true 
        AND (v_std_ids IS NULL OR std_id = ANY(v_std_ids))
    ),
    'n_room', (
        SELECT COUNT(*) FROM studio_rooms 
        WHERE room_active = true 
        AND (v_std_ids IS NULL OR std_id = ANY(v_std_ids))
    ),
    'room_busy', (
        SELECT COUNT(*) FROM studio_rooms 
        WHERE room_active = true AND room_occupied = true 
        AND (v_std_ids IS NULL OR std_id = ANY(v_std_ids))
    ),
    'top_models', (
      SELECT jsonb_agg(row_to_json(t)) FROM (
        SELECT u.user_name, u.user_surname, COALESCE(SUM(ms2.modstr_earnings_usd),0) AS total
        FROM users u
        JOIN model_streams ms2 ON ms2.user_id = u.user_id
        WHERE (v_std_ids IS NULL OR ms2.std_id = ANY(v_std_ids))
        GROUP BY u.user_id, u.user_name, u.user_surname
        ORDER BY total DESC LIMIT 5
      ) t
    ),
    'next_happy_birthdays', (
      SELECT jsonb_agg(row_to_json(t)) FROM (
        SELECT u.user_name, u.user_surname, u.user_birthdate
        FROM users u
        WHERE u.user_birthdate IS NOT NULL
        -- Solo cumpleaños de gente en los estudios seleccionados
        AND (v_std_ids IS NULL OR u.std_id = ANY(v_std_ids))
        ORDER BY
          CASE WHEN TO_CHAR(u.user_birthdate, 'MMDD') >= TO_CHAR(NOW(), 'MMDD')
            THEN TO_CHAR(u.user_birthdate, 'MMDD')
            ELSE (TO_CHAR(u.user_birthdate, 'MMDD')::INT + 1366)::TEXT
          END
        LIMIT 5
      ) t
    ),
    'trm', (
      SELECT row_to_json(t) FROM (
        SELECT exrate_usd AS usd, exrate_eur AS eur, exrate_date::TEXT AS date
        FROM exchange_rates ORDER BY exrate_date DESC LIMIT 1
      ) t
    )
  ) INTO result
  FROM model_streams ms
  WHERE (p_per_id IS NULL OR ms.modstr_id IN (
    SELECT modstr_id FROM model_streams -- Simplificación, en prod linkear con tabla periods
  ))
  AND (v_std_ids IS NULL OR ms.std_id = ANY(v_std_ids));

  RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: obtener tareas pendientes del dashboard
CREATE OR REPLACE FUNCTION get_dashboard_tasks(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_array(
    -- Cuartos disponibles sin modelo
    (SELECT jsonb_agg(jsonb_build_object(
      'task_id', room_id,
      'task_type', 'AVAILABLE_ROOM',
      'task_title', 'Cuarto disponible: ' || room_name,
      'task_description', 'Este cuarto no tiene modelo asignada',
      'task_icon', 'meeting_room',
      'task_icon_color', 'warning',
      'task_key_id', std_id
    )) FROM studio_rooms WHERE room_active = true AND room_occupied = false),
    -- Peticiones pendientes
    (SELECT jsonb_agg(jsonb_build_object(
      'task_id', pet_id,
      'task_type', 'PETITIONS',
      'task_title', pet_title,
      'task_description', pet_description,
      'task_icon', 'pending_actions',
      'task_icon_color', 'info',
      'task_key_id', pet_id
    )) FROM petitions WHERE pet_status = 'PENDING')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','settings','locations','categories','transaction_types',
    'periods','products','studios','studio_accounts','studio_rooms',
    'studio_shifts','studio_models','model_accounts','model_goals',
    'model_transactions','model_streams','commissions','bank_accounts',
    'payments','paysheets','transactions','petitions'
  ]) LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_%s_updated_at ON %I;
      CREATE TRIGGER set_%s_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$;
