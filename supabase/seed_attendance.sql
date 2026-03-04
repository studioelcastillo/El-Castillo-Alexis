-- Seed data for Attendance / ZKTeco (only if empty)

INSERT INTO attendance_devices (std_id, device_sn, device_alias, device_ip, device_area_name, device_status, last_sync_at)
SELECT * FROM (
  VALUES
    (NULL::INT, 'CIK7210001', 'Sede Principal Entrada', '192.168.1.101', 'Entrada', 'ONLINE', NOW() - INTERVAL '5 minutes'),
    (NULL::INT, 'CIK7210002', 'Sede Principal Salida', '192.168.1.102', 'Salida', 'OFFLINE', NOW() - INTERVAL '30 minutes')
) AS devices(std_id, device_sn, device_alias, device_ip, device_area_name, device_status, last_sync_at)
WHERE NOT EXISTS (SELECT 1 FROM attendance_devices LIMIT 1);

INSERT INTO attendance_employees (std_id, emp_code, first_name, last_name, department, linked_user_id, is_active)
SELECT * FROM (
  VALUES
    (NULL::INT, '2001', 'Maria', 'Lopez', 'Operaciones', NULL::INT, true),
    (NULL::INT, '2002', 'Andrea', 'Perez', 'Operaciones', NULL::INT, true),
    (NULL::INT, '2003', 'Luisa', 'Rojas', 'Administracion', NULL::INT, true),
    (NULL::INT, '2004', 'Camila', 'Diaz', 'Produccion', NULL::INT, true),
    (NULL::INT, '2005', 'Sofia', 'Torres', 'Produccion', NULL::INT, true)
) AS employees(std_id, emp_code, first_name, last_name, department, linked_user_id, is_active)
WHERE NOT EXISTS (SELECT 1 FROM attendance_employees LIMIT 1);

INSERT INTO attendance_transactions (std_id, emp_code, punch_time, punch_state, terminal_sn, verify_type)
SELECT * FROM (
  VALUES
    (NULL::INT, '2001', CURRENT_DATE + TIME '08:02', 'IN', 'CIK7210001', 1::INT),
    (NULL::INT, '2001', CURRENT_DATE + TIME '17:10', 'OUT', 'CIK7210001', 1::INT),
    (NULL::INT, '2002', CURRENT_DATE + TIME '08:20', 'IN', 'CIK7210001', 1::INT),
    (NULL::INT, '2002', CURRENT_DATE + TIME '16:55', 'OUT', 'CIK7210001', 1::INT),
    (NULL::INT, '2004', CURRENT_DATE + TIME '07:50', 'IN', 'CIK7210001', 1::INT),
    (NULL::INT, '2004', CURRENT_DATE + TIME '17:30', 'OUT', 'CIK7210001', 1::INT),
    (NULL::INT, '2005', CURRENT_DATE + TIME '08:00', 'IN', 'CIK7210001', 1::INT),
    (NULL::INT, '2005', CURRENT_DATE + TIME '16:30', 'OUT', 'CIK7210001', 1::INT)
) AS transactions(std_id, emp_code, punch_time, punch_state, terminal_sn, verify_type)
WHERE NOT EXISTS (SELECT 1 FROM attendance_transactions LIMIT 1);

INSERT INTO attendance_daily (
  user_id,
  full_name,
  role_name,
  att_date,
  shift_name,
  check_in,
  check_out,
  worked_minutes,
  expected_minutes,
  late_minutes,
  early_leave_minutes,
  overtime_minutes,
  debt_minutes,
  status
)
SELECT * FROM (
  VALUES
    (NULL::INT, 'Maria Lopez', 'MODELO', CURRENT_DATE, 'Turno Dia', CURRENT_DATE + TIME '08:02', CURRENT_DATE + TIME '17:10', 488::INT, 480::INT, 2::INT, 0::INT, 10::INT, 0::INT, 'PRESENT'),
    (NULL::INT, 'Andrea Perez', 'MODELO', CURRENT_DATE, 'Turno Dia', CURRENT_DATE + TIME '08:20', CURRENT_DATE + TIME '16:55', 455::INT, 480::INT, 20::INT, 5::INT, 0::INT, 25::INT, 'LATE'),
    (NULL::INT, 'Luisa Rojas', 'ADMIN', CURRENT_DATE, 'Turno Dia', NULL, NULL, 0::INT, 480::INT, 0::INT, 0::INT, 0::INT, 480::INT, 'ABSENT'),
    (NULL::INT, 'Camila Diaz', 'MODELO', CURRENT_DATE, 'Turno Dia', CURRENT_DATE + TIME '07:50', CURRENT_DATE + TIME '17:30', 520::INT, 480::INT, 0::INT, 0::INT, 40::INT, 0::INT, 'PRESENT'),
    (NULL::INT, 'Sofia Torres', 'MODELO', CURRENT_DATE, 'Turno Dia', CURRENT_DATE + TIME '08:00', CURRENT_DATE + TIME '16:30', 450::INT, 480::INT, 0::INT, 30::INT, 0::INT, 30::INT, 'PRESENT')
) AS daily(
  user_id,
  full_name,
  role_name,
  att_date,
  shift_name,
  check_in,
  check_out,
  worked_minutes,
  expected_minutes,
  late_minutes,
  early_leave_minutes,
  overtime_minutes,
  debt_minutes,
  status
)
WHERE NOT EXISTS (SELECT 1 FROM attendance_daily LIMIT 1);

INSERT INTO settings (set_key, set_value, set_description)
VALUES (
  'attendance_valuation',
  '{"minute_debt_price":200,"hour_debt_price":12000,"overtime_hour_price":15000,"currency":"COP"}',
  'Valores para valorizacion de asistencia'
)
ON CONFLICT (set_key) DO NOTHING;

INSERT INTO settings (set_key, set_value, set_description)
VALUES (
  'attendance_integration',
  '{"mode":"PUSH_ADMS","server_host":"livstre.com","server_port":4370,"comm_key":"0","device_id":"1","push_interval_seconds":120,"flush_interval_seconds":120,"max_batch_size":200,"dhcp_enabled":true,"ip_address":"192.60.5.120","subnet_mask":"255.255.255.0","gateway":"192.60.5.3","dns":"1.1.1.1","baud_rate":115200,"serial_port_mode":"IMPRIMIR"}',
  'Configuracion de integracion de asistencia (ADMS / BioTime)'
)
ON CONFLICT (set_key) DO NOTHING;
