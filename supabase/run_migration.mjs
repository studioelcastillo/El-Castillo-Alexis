// Temporary script to create api_modules tables via Supabase REST API
// Run: node supabase/run_migration.mjs

const SUPABASE_URL = 'https://wukvaemawvjavwqocxyb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.argv[2];

if (!SUPABASE_SERVICE_KEY) {
  console.log('Usage: node supabase/run_migration.mjs <service_role_key>');
  console.log('Or set SUPABASE_SERVICE_KEY environment variable');
  process.exit(1);
}

async function executeSql(sql, label) {
  console.log(`\n⏳ Executing: ${label}...`);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  });
  
  if (!res.ok) {
    const text = await res.text();
    console.log(`⚠️ REST RPC not available (${res.status}), trying pg-meta...`);
    return false;
  }
  console.log(`✅ ${label} - Done`);
  return true;
}

async function executeSqlViaPgMeta(sql, label) {
  console.log(`\n⏳ Executing via pg-meta: ${label}...`);
  // Use the Supabase Management API to run SQL
  const res = await fetch(`https://api.supabase.com/v1/projects/wukvaemawvjavwqocxyb/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  console.log(`✅ ${label} - Done`, data.length ? `(${data.length} rows)` : '');
  return data;
}

// SQL statements
const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS api_modules (
  module_id SERIAL PRIMARY KEY,
  module_key VARCHAR(100) NOT NULL UNIQUE,
  module_name VARCHAR(200) NOT NULL,
  module_group VARCHAR(100) DEFAULT 'GENERAL',
  module_icon VARCHAR(50) DEFAULT 'widgets',
  module_description TEXT,
  module_actions JSONB DEFAULT '["menu","show","add","edit","delete"]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_permissions (
  perm_id SERIAL PRIMARY KEY,
  prof_id INT NOT NULL,
  module_id INT NOT NULL REFERENCES api_modules(module_id) ON DELETE CASCADE,
  can_menu BOOLEAN DEFAULT false,
  can_show BOOLEAN DEFAULT false,
  can_add BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  custom_actions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prof_id, module_id)
);

CREATE TABLE IF NOT EXISTS api_user_overrides (
  override_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  module_id INT NOT NULL REFERENCES api_modules(module_id) ON DELETE CASCADE,
  can_menu BOOLEAN,
  can_show BOOLEAN,
  can_add BOOLEAN,
  can_edit BOOLEAN,
  can_delete BOOLEAN,
  custom_actions JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);
`;

const ENABLE_RLS = `
ALTER TABLE api_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_user_overrides ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_full_access' AND tablename = 'api_modules') THEN
    CREATE POLICY "authenticated_full_access" ON api_modules FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_full_access' AND tablename = 'api_permissions') THEN
    CREATE POLICY "authenticated_full_access" ON api_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_full_access' AND tablename = 'api_user_overrides') THEN
    CREATE POLICY "authenticated_full_access" ON api_user_overrides FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

const SEED_MODULES = `
INSERT INTO api_modules (module_key, module_name, module_group, module_icon, module_description, module_actions, sort_order) VALUES
  ('dashboard', 'Dashboard', 'GENERAL', 'dashboard', 'Panel principal con indicadores y gráficas', '["indicators","charts","tasks","show_as_user"]', 1),
  ('users', 'Usuarios', 'ADMIN', 'people', 'Gestión de usuarios del sistema', '["menu","show","add","edit","delete","activate","export","change_password","coincidence"]', 2),
  ('petitions', 'Solicitudes', 'ADMIN', 'assignment', 'Solicitudes y peticiones de modelos', '["menu","show","add","edit"]', 3),
  ('users_permissions2', 'Permisos Usuarios', 'ADMIN', 'security', 'Permisos individuales por usuario', '["menu","show","add","edit","delete"]', 4),
  ('logs', 'Auditoría', 'ADMIN', 'history', 'Registro de cambios en el sistema', '["menu","show"]', 5),
  ('login_history', 'Historial Sesiones', 'ADMIN', 'login', 'Historial de inicios de sesión', '["menu","show"]', 6),
  ('api_modules', 'Módulos API', 'ADMIN', 'api', 'Administración de módulos y permisos del API', '["menu","show","edit"]', 7),
  ('studios', 'Estudios', 'OPERACIONES', 'business', 'Gestión de estudios/sedes', '["menu","show","add","edit","delete"]', 10),
  ('studios_rooms', 'Cuartos', 'OPERACIONES', 'meeting_room', 'Salas de los estudios', '["menu","show","add","edit","delete"]', 11),
  ('studios_shifts', 'Turnos', 'OPERACIONES', 'schedule', 'Turnos de trabajo', '["menu","show","add","edit","delete"]', 12),
  ('studios_accounts', 'Cuentas Estudio', 'OPERACIONES', 'account_balance', 'Cuentas financieras de estudios', '["menu","show","add","edit","delete"]', 13),
  ('studios_models', 'Contratos', 'OPERACIONES', 'description', 'Contratos de modelos con estudios', '["menu","show","add","edit","delete","activate"]', 14),
  ('models_accounts', 'Cuentas de Modelo', 'OPERACIONES', 'manage_accounts', 'Cuentas de plataformas de modelos', '["menu","show","add","edit","delete","activate","transfer","modify_payment"]', 15),
  ('models_goals', 'Metas', 'OPERACIONES', 'flag', 'Metas de rendimiento por modelo', '["menu","show","add","edit","delete"]', 16),
  ('models_streams', 'Transmisiones', 'OPERACIONES', 'videocam', 'Registro de jornadas/transmisiones', '["menu","show","add","edit","delete"]', 17),
  ('models_streams_customers', 'Clientes', 'OPERACIONES', 'groups', 'Clientes registrados en transmisiones', '["menu","show","add","edit","delete"]', 18),
  ('models_streams_files', 'Cargues de Streams', 'OPERACIONES', 'upload_file', 'Archivos adjuntos de transmisiones', '["menu","show","add","edit","delete"]', 19),
  ('monitors', 'Monitores', 'OPERACIONES', 'supervisor_account', 'Vista de monitores y jerarquía', '["menu","show","add_hierarchy","delete_hierarchy"]', 20),
  ('models_transactions', 'Transacciones Modelo', 'FINANCIERO', 'swap_horiz', 'Movimientos financieros por modelo', '["menu","show","add_income","add_expenses","edit","delete"]', 30),
  ('transactions', 'Transacciones', 'FINANCIERO', 'receipt_long', 'Transacciones financieras generales', '["menu","show","add_income","add_expenses","edit","delete"]', 31),
  ('transactions_types', 'Tipos Transacción', 'FINANCIERO', 'category', 'Clasificación de transacciones', '["menu","show","add","edit","delete"]', 32),
  ('payments', 'Pagos', 'FINANCIERO', 'payments', 'Registro de pagos a modelos', '["menu","show","add","edit","delete"]', 33),
  ('payments_files', 'Cargues de Pagos', 'FINANCIERO', 'attach_file', 'Archivos de soporte de pagos', '["menu","show","add","edit","delete"]', 34),
  ('banks_accounts', 'Cuentas Bancarias', 'FINANCIERO', 'account_balance_wallet', 'Cuentas bancarias de usuarios', '["menu","show","add","edit","delete"]', 35),
  ('exchanges_rates', 'Tasas de Cambio', 'FINANCIERO', 'currency_exchange', 'Tasas de cambio USD/COP', '["menu","show","add","edit","delete"]', 36),
  ('categories', 'Categorías', 'CONFIGURACIÓN', 'label', 'Categorías de clasificación', '["menu","show","add","edit","delete"]', 40),
  ('products', 'Productos', 'CONFIGURACIÓN', 'inventory_2', 'Catálogo de productos/servicios', '["menu","show","add","edit","delete"]', 41),
  ('periods', 'Períodos', 'CONFIGURACIÓN', 'date_range', 'Períodos contables/operativos', '["menu","show","close"]', 42),
  ('locations', 'Ubicaciones', 'CONFIGURACIÓN', 'place', 'Países, departamentos, ciudades', '["menu","show","add","edit","delete"]', 43),
  ('accounts', 'Cuentas Contables', 'CONFIGURACIÓN', 'account_tree', 'Plan de cuentas contable', '["menu","show","add","edit"]', 44),
  ('settings', 'Configuraciones', 'CONFIGURACIÓN', 'settings', 'Configuraciones generales del sistema', '["menu","show","add","edit","delete"]', 45),
  ('setup_commissions', 'Config. Comisiones', 'COMISIONES', 'tune', 'Escalas y configuración de comisiones', '["menu","show","add","edit","delete"]', 50),
  ('commissions', 'Árbol Comisiones', 'COMISIONES', 'account_tree', 'Jerarquía de comisiones', '["menu","show","add","edit","delete"]', 51),
  ('models_liquidation', 'Liquidación Modelos', 'REPORTES', 'assessment', 'Reporte de liquidación por modelo', '["menu","show","generate_file"]', 60),
  ('studios_liquidation', 'Liquidación Estudios', 'REPORTES', 'summarize', 'Reporte de liquidación por estudio', '["menu","show","generate_file"]', 61),
  ('massive_liquidation', 'Cargue Masivo', 'REPORTES', 'cloud_upload', 'Importación masiva de streams', '["menu","show"]', 62),
  ('paysheet', 'Nómina', 'NÓMINA', 'request_quote', 'Módulo de nómina y liquidación laboral', '["menu","show","add","edit","delete","process"]', 70),
  ('notifications', 'Notificaciones', 'GENERAL', 'notifications', 'Centro de notificaciones', '["menu","show"]', 80),
  ('multimedia', 'Multimedia', 'GENERAL', 'perm_media', 'Gestión de archivos multimedia', '["add","delete"]', 81),
  ('myprofile', 'Mi Perfil', 'GENERAL', 'person', 'Edición del perfil propio', '["show","edit"]', 82)
ON CONFLICT (module_key) DO NOTHING;
`;

async function main() {
  console.log('🚀 Ejecutando migración de API Modules...\n');
  
  try {
    // Step 1: Create tables
    await executeSqlViaPgMeta(CREATE_TABLES, 'Crear tablas');
    
    // Step 2: Enable RLS
    await executeSqlViaPgMeta(ENABLE_RLS, 'Habilitar RLS');
    
    // Step 3: Seed modules
    await executeSqlViaPgMeta(SEED_MODULES, 'Poblar módulos');
    
    // Step 4: Verify
    const count = await executeSqlViaPgMeta('SELECT COUNT(*) as total FROM api_modules', 'Verificar módulos');
    console.log('\n🎉 Migración completada!');
    console.log('Módulos creados:', count);
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

main();
