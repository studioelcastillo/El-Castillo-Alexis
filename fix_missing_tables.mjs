import pg from 'pg';
const { Client } = pg;

const PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'pnnrsqocukixusmzrlhy';
const PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const host = process.env.SUPABASE_DB_HOST || 'aws-1-us-east-1.pooler.supabase.com';
const port = Number(process.env.SUPABASE_DB_PORT || 6543);
const connectionString = process.env.SUPABASE_DB_CONNECTION ||
  (PASSWORD ? `postgresql://postgres.${PROJECT_ID}:${encodeURIComponent(PASSWORD)}@${host}:${port}/postgres` : '');

if (!connectionString) {
  console.error('Missing SUPABASE_DB_CONNECTION or SUPABASE_DB_PASSWORD.');
  process.exit(1);
}

const sql = `
-- Tablas de Asistencia Faltantes
CREATE TABLE IF NOT EXISTS attendance_devices (
  std_id INT REFERENCES studios(std_id),
  device_sn VARCHAR(255) PRIMARY KEY,
  device_alias VARCHAR(255),
  device_ip VARCHAR(50),
  device_area_name VARCHAR(255),
  device_status VARCHAR(50),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_employees (
  std_id INT REFERENCES studios(std_id),
  emp_code VARCHAR(255) PRIMARY KEY,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  department VARCHAR(255),
  linked_user_id INT REFERENCES users(user_id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_transactions (
  std_id INT REFERENCES studios(std_id),
  emp_code VARCHAR(255) REFERENCES attendance_employees(emp_code),
  punch_time TIMESTAMPTZ,
  punch_state VARCHAR(50),
  terminal_sn VARCHAR(255),
  verify_type INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (emp_code, punch_time)
);

CREATE TABLE IF NOT EXISTS attendance_daily (
  att_id SERIAL PRIMARY KEY,
  user_id INT,
  full_name VARCHAR(500),
  role_name VARCHAR(255),
  att_date DATE,
  shift_name VARCHAR(255),
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  worked_minutes INT,
  expected_minutes INT,
  late_minutes INT,
  early_leave_minutes INT,
  overtime_minutes INT,
  debt_minutes INT,
  status VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Re-intentar la semilla de asistencia
INSERT INTO attendance_devices (std_id, device_sn, device_alias, device_ip, device_area_name, device_status, last_sync_at)
VALUES (NULL, 'CIK7210001', 'Sede Principal Entrada', '192.168.1.101', 'Entrada', 'ONLINE', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO attendance_employees (std_id, emp_code, first_name, last_name, department, is_active)
VALUES (NULL, '2001', 'Maria', 'Lopez', 'Operaciones', true)
ON CONFLICT DO NOTHING;
`;

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Creating missing tables...');
    await client.query(sql);
    console.log('✅ Missing tables created and seeded.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
