-- ==========================================================
-- EL CASTILLO - Schema Extensions
-- Purpose: Add tables for Room Control, Attendance, Store,
-- Content Sales, Photography, Chat, Monetization, and Commissions
-- Compatible with existing schema.sql
-- ==========================================================

-- NOTE: Run this in Supabase SQL Editor after schema.sql

-- ==========================================================
-- ROOM CONTROL
-- ==========================================================

-- ==========================================================
-- PETITIONS ADJUSTMENTS
-- ==========================================================

ALTER TABLE IF EXISTS petitions
  ADD COLUMN IF NOT EXISTS stdmod_id INT REFERENCES studios_models(stdmod_id);

ALTER TABLE IF EXISTS petitions
  ALTER COLUMN ptn_state SET DEFAULT 'EN PROCESO';

UPDATE petitions
SET ptn_state = 'PENDIENTE'
WHERE ptn_state = 'PENDING';

CREATE TABLE IF NOT EXISTS petition_states (
  ptnstate_id SERIAL PRIMARY KEY,
  ptn_id INT NOT NULL REFERENCES petitions(ptn_id) ON DELETE CASCADE,
  user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  ptnstate_state VARCHAR(255) NOT NULL,
  ptnstate_observation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS petition_states_ptn_id_idx ON petition_states(ptn_id);

INSERT INTO petition_states (ptn_id, user_id, ptnstate_state, ptnstate_observation, created_at, updated_at)
SELECT ptn_id,
       NULL,
       CASE
         WHEN ptn_state = 'PENDING' THEN 'PENDIENTE'
         ELSE ptn_state
       END,
       ptn_observation,
       COALESCE(updated_at, created_at, NOW()),
       COALESCE(updated_at, created_at, NOW())
FROM petitions
WHERE ptn_state IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM petition_states ps WHERE ps.ptn_id = petitions.ptn_id
  );

CREATE TABLE IF NOT EXISTS room_types (
  room_type_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  room_type_name VARCHAR(255) NOT NULL,
  room_type_description TEXT,
  room_type_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend studios_rooms for Room Control UI fields
ALTER TABLE IF EXISTS studios_rooms
  ADD COLUMN IF NOT EXISTS stdroom_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS stdroom_floor VARCHAR(50),
  ADD COLUMN IF NOT EXISTS stdroom_status VARCHAR(20) DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS stdroom_notes TEXT,
  ADD COLUMN IF NOT EXISTS stdroom_incidents_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS room_type_id INT;

CREATE TABLE IF NOT EXISTS room_assignments (
  room_assign_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  stdroom_id INT REFERENCES studios_rooms(stdroom_id) ON DELETE CASCADE,
  user_id_model INT REFERENCES users(user_id) ON DELETE SET NULL,
  user_id_monitor INT REFERENCES users(user_id) ON DELETE SET NULL,
  model_name VARCHAR(255),
  monitor_name VARCHAR(255),
  model_avatar_url TEXT,
  assign_date DATE NOT NULL,
  shift_type VARCHAR(20) NOT NULL,
  assign_status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
  assign_notes TEXT,
  assign_is_range BOOLEAN DEFAULT false,
  assign_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouse_items (
  warehouse_item_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  item_category VARCHAR(255),
  item_brand VARCHAR(255),
  item_model VARCHAR(255),
  unit_cost NUMERIC(14,4) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'COP',
  stock_qty NUMERIC(14,4) DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  serial_required BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouse_movements (
  warehouse_move_id SERIAL PRIMARY KEY,
  warehouse_item_id INT REFERENCES warehouse_items(warehouse_item_id) ON DELETE CASCADE,
  movement_type VARCHAR(30) NOT NULL,
  movement_qty NUMERIC(14,4) NOT NULL,
  unit_cost_snapshot NUMERIC(14,4) DEFAULT 0,
  related_stdroom_id INT REFERENCES studios_rooms(stdroom_id) ON DELETE SET NULL,
  movement_notes TEXT,
  movement_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_inventory (
  room_inventory_id SERIAL PRIMARY KEY,
  stdroom_id INT REFERENCES studios_rooms(stdroom_id) ON DELETE CASCADE,
  warehouse_item_id INT REFERENCES warehouse_items(warehouse_item_id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  item_qty NUMERIC(14,4) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(14,4) DEFAULT 0,
  item_condition VARCHAR(20) DEFAULT 'OK',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_tickets (
  room_ticket_id SERIAL PRIMARY KEY,
  room_assign_id INT REFERENCES room_assignments(room_assign_id) ON DELETE CASCADE,
  stdroom_id INT REFERENCES studios_rooms(stdroom_id) ON DELETE CASCADE,
  ticket_type VARCHAR(20) NOT NULL,
  ticket_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  ticket_notes TEXT,
  rating_model_to_monitor INT,
  rating_monitor_to_model INT,
  signed_by_model BOOLEAN DEFAULT false NOT NULL,
  signed_by_monitor BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_ticket_items (
  room_ticket_item_id SERIAL PRIMARY KEY,
  room_ticket_id INT REFERENCES room_tickets(room_ticket_id) ON DELETE CASCADE,
  room_inventory_id INT REFERENCES room_inventory(room_inventory_id) ON DELETE SET NULL,
  warehouse_item_id INT REFERENCES warehouse_items(warehouse_item_id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  item_qty NUMERIC(14,4) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(14,4) DEFAULT 0,
  item_condition VARCHAR(20) DEFAULT 'OK'
);

CREATE TABLE IF NOT EXISTS system_alerts (
  system_alert_id SERIAL PRIMARY KEY,
  alert_type VARCHAR(100) NOT NULL,
  subject_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  subject_name VARCHAR(255),
  subject_role VARCHAR(50),
  severity VARCHAR(20) NOT NULL,
  alert_status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  streak_count INT DEFAULT 0,
  message TEXT NOT NULL,
  metadata_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by INT REFERENCES users(user_id) ON DELETE SET NULL
);

-- ==========================================================
-- ATTENDANCE / ZKTECO
-- ==========================================================

CREATE TABLE IF NOT EXISTS attendance_devices (
  att_device_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  device_sn VARCHAR(100) NOT NULL,
  device_alias VARCHAR(255),
  device_ip VARCHAR(50),
  device_area_name VARCHAR(255),
  device_status VARCHAR(20) DEFAULT 'OFFLINE',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_employees (
  att_emp_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  emp_code VARCHAR(100) NOT NULL,
  first_name VARCHAR(150) NOT NULL,
  last_name VARCHAR(150) NOT NULL,
  department VARCHAR(150),
  linked_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_transactions (
  att_tx_id BIGSERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  emp_code VARCHAR(100) NOT NULL,
  punch_time TIMESTAMPTZ NOT NULL,
  punch_state VARCHAR(20) NOT NULL,
  terminal_sn VARCHAR(100),
  verify_type INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_shifts (
  work_shift_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  shift_name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  grace_period_minutes INT DEFAULT 0,
  is_night_shift BOOLEAN DEFAULT false,
  days_of_week INT[] DEFAULT ARRAY[1,2,3,4,5]::INT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_daily (
  att_day_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  full_name VARCHAR(255),
  role_name VARCHAR(100),
  att_date DATE NOT NULL,
  work_shift_id INT REFERENCES work_shifts(work_shift_id) ON DELETE SET NULL,
  shift_name VARCHAR(150),
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  worked_minutes INT DEFAULT 0,
  expected_minutes INT DEFAULT 0,
  late_minutes INT DEFAULT 0,
  early_leave_minutes INT DEFAULT 0,
  overtime_minutes INT DEFAULT 0,
  debt_minutes INT DEFAULT 0,
  status VARCHAR(30) DEFAULT 'PRESENT',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS attendance_devices_sn_key ON attendance_devices(device_sn);
CREATE UNIQUE INDEX IF NOT EXISTS attendance_employees_emp_code_key ON attendance_employees(emp_code);
CREATE UNIQUE INDEX IF NOT EXISTS attendance_transactions_unique_key ON attendance_transactions(emp_code, punch_time, terminal_sn);

-- ==========================================================
-- STORE / INVENTORY (EXTEND EXISTING PRODUCTS/CATEGORIES)
-- ==========================================================

ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS std_id INT,
  ADD COLUMN IF NOT EXISTS prod_brand VARCHAR(255),
  ADD COLUMN IF NOT EXISTS prod_unit VARCHAR(50),
  ADD COLUMN IF NOT EXISTS prod_description_short TEXT,
  ADD COLUMN IF NOT EXISTS prod_description_long TEXT,
  ADD COLUMN IF NOT EXISTS prod_min_stock NUMERIC(14,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prod_is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS prod_status VARCHAR(30) DEFAULT 'IN_STOCK',
  ADD COLUMN IF NOT EXISTS prod_tax_rate NUMERIC(6,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS product_images (
  prod_image_id SERIAL PRIMARY KEY,
  prod_id INT NOT NULL REFERENCES products(prod_id) ON DELETE CASCADE,
  url_thumb TEXT,
  url_medium TEXT,
  url_original TEXT,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
  variant_id SERIAL PRIMARY KEY,
  prod_id INT NOT NULL REFERENCES products(prod_id) ON DELETE CASCADE,
  variant_sku VARCHAR(100),
  variant_name VARCHAR(255) NOT NULL,
  attributes_json JSONB,
  variant_stock NUMERIC(14,4) DEFAULT 0,
  variant_status VARCHAR(30) DEFAULT 'IN_STOCK',
  price_override NUMERIC(14,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_lots (
  lot_id SERIAL PRIMARY KEY,
  variant_id INT NOT NULL REFERENCES product_variants(variant_id) ON DELETE CASCADE,
  received_at DATE NOT NULL,
  unit_cost NUMERIC(14,4) NOT NULL,
  initial_qty NUMERIC(14,4) NOT NULL,
  current_qty NUMERIC(14,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  movement_id SERIAL PRIMARY KEY,
  variant_id INT NOT NULL REFERENCES product_variants(variant_id) ON DELETE CASCADE,
  movement_type VARCHAR(30) NOT NULL,
  qty NUMERIC(14,4) NOT NULL,
  unit_cost_snapshot NUMERIC(14,4) DEFAULT 0,
  movement_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  order_id INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cost_centers (
  cost_center_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  cost_center_code VARCHAR(50) NOT NULL,
  cost_center_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_orders (
  order_id SERIAL PRIMARY KEY,
  order_code VARCHAR(50),
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  buyer_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  buyer_name VARCHAR(255),
  cost_center_id INT REFERENCES cost_centers(cost_center_id) ON DELETE SET NULL,
  order_status VARCHAR(30) DEFAULT 'PENDING_APPROVAL',
  subtotal NUMERIC(14,4) DEFAULT 0,
  tax_total NUMERIC(14,4) DEFAULT 0,
  total_amount NUMERIC(14,4) DEFAULT 0,
  payment_method VARCHAR(30),
  payment_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by INT REFERENCES users(user_id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS store_order_items (
  order_item_id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES store_orders(order_id) ON DELETE CASCADE,
  prod_id INT REFERENCES products(prod_id) ON DELETE SET NULL,
  variant_id INT REFERENCES product_variants(variant_id) ON DELETE SET NULL,
  product_name VARCHAR(255),
  variant_name VARCHAR(255),
  qty NUMERIC(14,4) NOT NULL,
  unit_price NUMERIC(14,4) NOT NULL,
  total NUMERIC(14,4) NOT NULL,
  tax_rate NUMERIC(6,2) DEFAULT 0,
  tax_amount NUMERIC(14,4) DEFAULT 0,
  cogs_unit NUMERIC(14,4) DEFAULT 0,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS loan_requests (
  loan_request_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  amount NUMERIC(14,4) NOT NULL,
  periods INT NOT NULL,
  reason TEXT,
  status VARCHAR(30) DEFAULT 'PENDING_APPROVAL',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by INT REFERENCES users(user_id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS installment_plans (
  plan_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  total_amount NUMERIC(14,4) NOT NULL,
  monthly_payment NUMERIC(14,4) NOT NULL,
  term_months INT NOT NULL,
  status VARCHAR(30) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS requisitions (
  requisition_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  product_name VARCHAR(255) NOT NULL,
  qty NUMERIC(14,4) NOT NULL,
  urgency VARCHAR(20) DEFAULT 'MEDIUM',
  status VARCHAR(30) DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_rules (
  fin_rule_id SERIAL PRIMARY KEY,
  role_id INT NOT NULL,
  term_type VARCHAR(20) NOT NULL,
  allowed BOOLEAN DEFAULT true,
  max_amount NUMERIC(14,4) DEFAULT 0,
  max_periods INT DEFAULT 1,
  interest_rate NUMERIC(6,2) DEFAULT 0,
  requires_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- MONETIZATION (PLATFORMS, BENEFICIARIES, LIQUIDATIONS)
-- ==========================================================

CREATE TABLE IF NOT EXISTS monetization_platforms (
  platform_id SERIAL PRIMARY KEY,
  platform_name VARCHAR(255) NOT NULL,
  platform_type VARCHAR(50) NOT NULL,
  default_commission_pct NUMERIC(6,2) DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monetization_beneficiaries (
  beneficiary_id SERIAL PRIMARY KEY,
  beneficiary_type VARCHAR(20) NOT NULL,
  beneficiary_name VARCHAR(255) NOT NULL,
  beneficiary_identification VARCHAR(100) NOT NULL,
  beneficiary_legal_note TEXT,
  retentions_enabled BOOLEAN DEFAULT false,
  default_retention_pct NUMERIC(6,2) DEFAULT 0,
  default_commission_pct NUMERIC(6,2) DEFAULT 0,
  beneficiary_active BOOLEAN DEFAULT true,
  bank_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monetization_liquidations (
  liquidation_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  liquidation_date DATE NOT NULL,
  beneficiary_id INT REFERENCES monetization_beneficiaries(beneficiary_id) ON DELETE SET NULL,
  beneficiary_name VARCHAR(255),
  beneficiary_doc VARCHAR(100),
  trm_pago NUMERIC(14,4) DEFAULT 0,
  trm_real NUMERIC(14,4) DEFAULT 0,
  total_usd NUMERIC(14,4) DEFAULT 0,
  total_cop_bruto NUMERIC(14,4) DEFAULT 0,
  commission_percentage NUMERIC(6,2) DEFAULT 0,
  commission_cop NUMERIC(14,4) DEFAULT 0,
  total_discounts_cop NUMERIC(14,4) DEFAULT 0,
  total_retentions_cop NUMERIC(14,4) DEFAULT 0,
  base_payable_cop NUMERIC(14,4) DEFAULT 0,
  total_payable_cop NUMERIC(14,4) DEFAULT 0,
  spread_profit_cop NUMERIC(14,4) DEFAULT 0,
  total_real_profit_cop NUMERIC(14,4) DEFAULT 0,
  liquidation_status VARCHAR(20) DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monetization_liquidation_items (
  liquidation_item_id SERIAL PRIMARY KEY,
  liquidation_id INT NOT NULL REFERENCES monetization_liquidations(liquidation_id) ON DELETE CASCADE,
  platform_id INT REFERENCES monetization_platforms(platform_id) ON DELETE SET NULL,
  platform_name VARCHAR(255),
  item_type VARCHAR(20) NOT NULL,
  amount_usd NUMERIC(14,4) DEFAULT 0,
  tokens NUMERIC(14,4) DEFAULT 0,
  token_value_snapshot NUMERIC(14,6) DEFAULT 0,
  calculated_usd NUMERIC(14,4) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS monetization_liquidation_discounts (
  liquidation_discount_id SERIAL PRIMARY KEY,
  liquidation_id INT NOT NULL REFERENCES monetization_liquidations(liquidation_id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  amount_cop NUMERIC(14,4) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS monetization_liquidation_retentions (
  liquidation_retention_id SERIAL PRIMARY KEY,
  liquidation_id INT NOT NULL REFERENCES monetization_liquidations(liquidation_id) ON DELETE CASCADE,
  retention_type VARCHAR(255) NOT NULL,
  percentage NUMERIC(6,2) DEFAULT 0,
  base_amount_cop NUMERIC(14,4) DEFAULT 0,
  calculated_amount_cop NUMERIC(14,4) DEFAULT 0
);

-- ==========================================================
-- PHOTOGRAPHY
-- ==========================================================

CREATE TABLE IF NOT EXISTS photo_requests (
  photo_req_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  requester_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  requester_name VARCHAR(255),
  photo_type VARCHAR(20) NOT NULL,
  objective VARCHAR(100),
  location VARCHAR(255),
  proposed_date DATE,
  proposed_time TIME,
  duration_minutes INT DEFAULT 60,
  confirmed_date TIMESTAMPTZ,
  style_references TEXT,
  requires_makeup BOOLEAN DEFAULT false,
  makeup_artist_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  makeup_artist_name VARCHAR(255),
  photographer_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  status VARCHAR(30) DEFAULT 'SENT',
  priority VARCHAR(20) DEFAULT 'NORMAL',
  history_log JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photo_assets (
  photo_asset_id SERIAL PRIMARY KEY,
  photo_req_id INT NOT NULL REFERENCES photo_requests(photo_req_id) ON DELETE CASCADE,
  asset_type VARCHAR(10) NOT NULL,
  file_url TEXT,
  preview_url TEXT,
  drive_file_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photo_ratings (
  photo_rating_id SERIAL PRIMARY KEY,
  photo_req_id INT NOT NULL REFERENCES photo_requests(photo_req_id) ON DELETE CASCADE,
  from_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  to_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  role_target VARCHAR(50),
  score INT NOT NULL,
  aspects JSONB,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photo_calendar_events (
  photo_event_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  photo_req_id INT REFERENCES photo_requests(photo_req_id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  event_type VARCHAR(20) NOT NULL,
  event_status VARCHAR(30),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  resource_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- CONTENT SALES
-- ==========================================================

CREATE TABLE IF NOT EXISTS content_platforms (
  content_platform_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  platform_name VARCHAR(255) NOT NULL,
  icon VARCHAR(100),
  is_active BOOLEAN DEFAULT true NOT NULL,
  color VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_assets (
  content_asset_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  model_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  model_name VARCHAR(255),
  asset_type VARCHAR(10) NOT NULL,
  preview_url TEXT,
  file_url TEXT,
  status VARCHAR(30) DEFAULT 'PENDING_REVIEW',
  tags_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_tasks (
  content_task_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  model_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  model_name VARCHAR(255),
  model_avatar TEXT,
  status VARCHAR(30) DEFAULT 'PENDING',
  streamate_hours NUMERIC(10,2) DEFAULT 0,
  platforms JSONB,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_to_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  assigned_name VARCHAR(255),
  completed_at TIMESTAMPTZ,
  completed_date DATE
);

-- ==========================================================
-- CHAT
-- ==========================================================

CREATE TABLE IF NOT EXISTS chat_profiles (
  chat_profile_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  role_id INT,
  role_name VARCHAR(100),
  presence_status VARCHAR(20) DEFAULT 'offline',
  avatar_url TEXT,
  avatar_version INT DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_conversations (
  conversation_id SERIAL PRIMARY KEY,
  conversation_type VARCHAR(10) NOT NULL,
  conversation_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_conversation_members (
  conversation_member_id SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE,
  sender_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  sender_name VARCHAR(255),
  sender_avatar_url TEXT,
  message_type VARCHAR(30) DEFAULT 'text',
  content_text TEXT,
  media_url TEXT,
  reply_to_id INT REFERENCES chat_messages(message_id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_policies (
  chat_policy_id SERIAL PRIMARY KEY,
  from_role_id INT NOT NULL,
  to_role_id INT NOT NULL,
  can_initiate BOOLEAN DEFAULT true,
  can_receive BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_templates (
  template_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  body_text TEXT,
  variables_json JSONB,
  attachments_json JSONB,
  scope VARCHAR(20) DEFAULT 'global',
  role_id INT,
  is_active BOOLEAN DEFAULT true,
  created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_broadcast_lists (
  broadcast_list_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  audience_rules_json JSONB,
  created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_broadcast_jobs (
  broadcast_job_id SERIAL PRIMARY KEY,
  created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
  mode VARCHAR(30) NOT NULL,
  audience_snapshot_json JSONB,
  message_payload_json JSONB,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'running',
  total_targets INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  skipped_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS chat_automations (
  automation_id SERIAL PRIMARY KEY,
  trigger_type VARCHAR(20) NOT NULL,
  trigger_event VARCHAR(100),
  schedule_cron VARCHAR(100),
  conditions_json JSONB,
  target_json JSONB,
  template_id INT REFERENCES chat_templates(template_id) ON DELETE SET NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_automation_jobs (
  automation_job_id SERIAL PRIMARY KEY,
  automation_id INT REFERENCES chat_automations(automation_id) ON DELETE CASCADE,
  status VARCHAR(30) DEFAULT 'running',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- ==========================================================
-- SETUP COMMISSIONS (ADVANCED)
-- ==========================================================

CREATE TABLE IF NOT EXISTS setup_commissions (
  setcomm_id SERIAL PRIMARY KEY,
  setcomm_title VARCHAR(255) NOT NULL,
  setcomm_description TEXT,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  setcomm_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS setup_commissions_item (
  setcommitem_id SERIAL PRIMARY KEY,
  setcomm_id INT NOT NULL REFERENCES setup_commissions(setcomm_id) ON DELETE CASCADE,
  setcommitem_limit NUMERIC(14,4) DEFAULT 0,
  setcommitem_value NUMERIC(14,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- UTILITY CONTROL (FINANCE)
-- ==========================================================

CREATE TABLE IF NOT EXISTS utility_companies (
  utility_company_id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_demo BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_sedes (
  utility_sede_id SERIAL PRIMARY KEY,
  utility_company_id INT REFERENCES utility_companies(utility_company_id) ON DELETE CASCADE,
  sede_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_cost_centers (
  utility_cost_center_id SERIAL PRIMARY KEY,
  utility_sede_id INT REFERENCES utility_sedes(utility_sede_id) ON DELETE CASCADE,
  center_code VARCHAR(50) NOT NULL,
  center_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_areas (
  utility_area_id SERIAL PRIMARY KEY,
  utility_sede_id INT REFERENCES utility_sedes(utility_sede_id) ON DELETE CASCADE,
  area_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_income_lines (
  utility_income_line_id SERIAL PRIMARY KEY,
  utility_company_id INT REFERENCES utility_companies(utility_company_id) ON DELETE CASCADE,
  line_name VARCHAR(255) NOT NULL,
  line_category VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_periods (
  utility_period_id SERIAL PRIMARY KEY,
  utility_company_id INT REFERENCES utility_companies(utility_company_id) ON DELETE CASCADE,
  period_year INT NOT NULL,
  period_month INT NOT NULL,
  period_status VARCHAR(20) DEFAULT 'OPEN',
  closed_by VARCHAR(255),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_income_records (
  utility_income_id SERIAL PRIMARY KEY,
  utility_period_id INT REFERENCES utility_periods(utility_period_id) ON DELETE CASCADE,
  utility_income_line_id INT REFERENCES utility_income_lines(utility_income_line_id) ON DELETE SET NULL,
  value NUMERIC(14,4) NOT NULL,
  currency VARCHAR(10) DEFAULT 'COP',
  record_date DATE NOT NULL,
  utility_sede_id INT REFERENCES utility_sedes(utility_sede_id) ON DELETE SET NULL,
  utility_cost_center_id INT REFERENCES utility_cost_centers(utility_cost_center_id) ON DELETE SET NULL,
  utility_area_id INT REFERENCES utility_areas(utility_area_id) ON DELETE SET NULL,
  notes TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_expense_catalog (
  utility_expense_catalog_id SERIAL PRIMARY KEY,
  utility_company_id INT REFERENCES utility_companies(utility_company_id) ON DELETE CASCADE,
  catalog_name VARCHAR(255) NOT NULL,
  catalog_category VARCHAR(100) NOT NULL,
  catalog_subcategory VARCHAR(100),
  expense_type VARCHAR(20) DEFAULT 'OPERATIVO',
  recurrent BOOLEAN DEFAULT false,
  frequency VARCHAR(20) DEFAULT 'MENSUAL',
  every_n_months INT,
  fixed_value BOOLEAN DEFAULT false,
  base_value NUMERIC(14,4),
  currency VARCHAR(10) DEFAULT 'COP',
  default_scope VARCHAR(20) DEFAULT 'COMPANY',
  scope_id VARCHAR(100),
  provider_id VARCHAR(100),
  requires_assignment BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_expense_records (
  utility_expense_id SERIAL PRIMARY KEY,
  utility_period_id INT REFERENCES utility_periods(utility_period_id) ON DELETE CASCADE,
  utility_expense_catalog_id INT REFERENCES utility_expense_catalog(utility_expense_catalog_id) ON DELETE SET NULL,
  value NUMERIC(14,4) NOT NULL,
  currency VARCHAR(10) DEFAULT 'COP',
  record_date DATE NOT NULL,
  utility_sede_id INT REFERENCES utility_sedes(utility_sede_id) ON DELETE SET NULL,
  utility_cost_center_id INT REFERENCES utility_cost_centers(utility_cost_center_id) ON DELETE SET NULL,
  utility_area_id INT REFERENCES utility_areas(utility_area_id) ON DELETE SET NULL,
  provider_id VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_assignment_rules (
  utility_rule_id SERIAL PRIMARY KEY,
  utility_company_id INT REFERENCES utility_companies(utility_company_id) ON DELETE CASCADE,
  utility_expense_catalog_id INT REFERENCES utility_expense_catalog(utility_expense_catalog_id) ON DELETE CASCADE,
  assign_mode VARCHAR(20) DEFAULT 'PERCENTAGE',
  details_json JSONB,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_partners (
  utility_partner_id SERIAL PRIMARY KEY,
  utility_company_id INT REFERENCES utility_companies(utility_company_id) ON DELETE CASCADE,
  partner_name VARCHAR(255) NOT NULL,
  percentage NUMERIC(6,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_audit_logs (
  utility_audit_id SERIAL PRIMARY KEY,
  utility_company_id INT REFERENCES utility_companies(utility_company_id) ON DELETE CASCADE,
  user_id VARCHAR(100),
  entity VARCHAR(100),
  entity_id VARCHAR(100),
  action VARCHAR(30) NOT NULL,
  before_json JSONB,
  after_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_employee_loans (
  utility_loan_id SERIAL PRIMARY KEY,
  utility_company_id INT REFERENCES utility_companies(utility_company_id) ON DELETE CASCADE,
  employee_id VARCHAR(100) NOT NULL,
  utility_sede_id INT REFERENCES utility_sedes(utility_sede_id) ON DELETE SET NULL,
  utility_area_id INT REFERENCES utility_areas(utility_area_id) ON DELETE SET NULL,
  loan_date DATE NOT NULL,
  principal NUMERIC(14,4) NOT NULL,
  interest_rate NUMERIC(6,4) DEFAULT 0,
  installments INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  balance NUMERIC(14,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- REMOTE DESKTOP
-- ==========================================================

CREATE TABLE IF NOT EXISTS remote_devices (
  remote_device_id SERIAL PRIMARY KEY,
  device_uuid VARCHAR(255),
  device_name VARCHAR(255) NOT NULL,
  device_status VARCHAR(20) DEFAULT 'OFFLINE',
  last_seen TIMESTAMPTZ,
  os VARCHAR(20),
  device_version VARCHAR(50),
  ip_address VARCHAR(50),
  unattended_enabled BOOLEAN DEFAULT false,
  current_session_id INT,
  groups_json JSONB,
  tags_json JSONB,
  monitors_count INT DEFAULT 1,
  preview_url TEXT,
  preview_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS remote_sessions (
  remote_session_id SERIAL PRIMARY KEY,
  remote_device_id INT REFERENCES remote_devices(remote_device_id) ON DELETE CASCADE,
  user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  permissions_json JSONB,
  status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS remote_access_policies (
  remote_policy_id SERIAL PRIMARY KEY,
  policy_name VARCHAR(255) NOT NULL,
  allow_unattended BOOLEAN DEFAULT false,
  require_consent BOOLEAN DEFAULT false,
  allow_audio BOOLEAN DEFAULT false,
  allow_control BOOLEAN DEFAULT false,
  allowed_roles JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS remote_audit_logs (
  remote_audit_id SERIAL PRIMARY KEY,
  actor_name VARCHAR(255),
  action VARCHAR(30) NOT NULL,
  target_name VARCHAR(255),
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- SHIFT ASSIGNMENTS
-- ==========================================================

CREATE TABLE IF NOT EXISTS shift_monitor_schedules (
  shift_schedule_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  monitor_user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  shift_id INT REFERENCES studios_shifts(stdshift_id) ON DELETE SET NULL,
  is_day_off BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (monitor_user_id, schedule_date)
);

CREATE TABLE IF NOT EXISTS shift_model_assignments (
  shift_assignment_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  model_user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  monitor_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  secondary_monitor_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  weekly_target NUMERIC(14,4) DEFAULT 0,
  current_sales NUMERIC(14,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (model_user_id)
);

ALTER TABLE IF EXISTS shift_model_assignments
  ADD COLUMN IF NOT EXISTS weekly_target NUMERIC(14,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_sales NUMERIC(14,4) DEFAULT 0;

CREATE TABLE IF NOT EXISTS shift_settings (
  shift_settings_id SERIAL PRIMARY KEY,
  settings_key VARCHAR(50) UNIQUE DEFAULT 'default',
  std_id INT REFERENCES studios(std_id) ON DELETE SET NULL,
  daily_minutes INT DEFAULT 480,
  tolerance_minutes INT DEFAULT 0,
  penalty_amount NUMERIC(14,4) DEFAULT 0,
  double_late BOOLEAN DEFAULT true,
  double_missing BOOLEAN DEFAULT true,
  not_accumulative BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS attendance_daily
  ADD COLUMN IF NOT EXISTS penalty_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS penalty_applied BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS penalty_amount NUMERIC(14,4) DEFAULT 0;

-- ==========================================================
-- RLS (Authenticated full access for new tables)
-- ==========================================================

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'room_types',
    'room_assignments',
    'warehouse_items',
    'warehouse_movements',
    'room_inventory',
    'room_tickets',
    'room_ticket_items',
    'system_alerts',
    'attendance_devices',
    'attendance_employees',
    'attendance_transactions',
    'work_shifts',
    'attendance_daily',
    'product_images',
    'product_variants',
    'inventory_lots',
    'inventory_movements',
    'cost_centers',
    'store_orders',
    'store_order_items',
    'loan_requests',
    'installment_plans',
    'requisitions',
    'financial_rules',
    'monetization_platforms',
    'monetization_beneficiaries',
    'monetization_liquidations',
    'monetization_liquidation_items',
    'monetization_liquidation_discounts',
    'monetization_liquidation_retentions',
    'photo_requests',
    'photo_assets',
    'photo_ratings',
    'photo_calendar_events',
    'content_platforms',
    'content_assets',
    'content_tasks',
    'chat_profiles',
    'chat_conversations',
    'chat_conversation_members',
    'chat_messages',
    'chat_policies',
    'chat_templates',
    'chat_broadcast_lists',
    'chat_broadcast_jobs',
    'chat_automations',
    'chat_automation_jobs',
    'setup_commissions',
    'setup_commissions_item',
    'utility_companies',
    'utility_sedes',
    'utility_cost_centers',
    'utility_areas',
    'utility_income_lines',
    'utility_periods',
    'utility_income_records',
    'utility_expense_catalog',
    'utility_expense_records',
    'utility_assignment_rules',
    'utility_partners',
    'utility_audit_logs',
    'utility_employee_loans',
    'remote_devices',
    'remote_sessions',
    'remote_access_policies',
    'remote_audit_logs',
    'shift_monitor_schedules',
    'shift_model_assignments',
    'shift_settings',
    'petition_states'
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

-- ==========================================================
-- DASHBOARD TASKS (Petitions state compatibility)
-- ==========================================================

CREATE OR REPLACE FUNCTION get_dashboard_tasks(p_user_id INT)
RETURNS JSONB AS $$
DECLARE
    v_prof_id INT;
    v_std_id INT;
    v_tasks JSONB := '[]'::JSONB;
BEGIN
    -- Obtenemos perfil y estudio del usuario que consulta (si aplica)
    SELECT prof_id, std_id INTO v_prof_id, v_std_id FROM users WHERE user_id = p_user_id;

    -- 1. Cuartos disponibles sin modelo (Para RRHH, Admin, Estudio, Coordinador)
    IF v_prof_id IN (1, 2, 3, 6, 8, 11) THEN
        v_tasks := v_tasks || COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'task_id', stdroom_id,
                'task_type', 'AVAILABLE_ROOM',
                'task_title', 'Cuarto disponible: ' || stdroom_name,
                'task_description', 'Este cuarto no tiene modelo asignada',
                'task_icon', 'meeting_room',
                'task_icon_color', 'warning',
                'task_key_id', std_id
            ))
            FROM studios_rooms
            WHERE stdroom_active = true AND stdroom_occupied = false
            AND (v_std_id IS NULL OR std_id = v_std_id)
        ), '[]'::JSONB);
    END IF;

    -- 2. Peticiones pendientes (Para Perfiles Administrativos)
    IF v_prof_id IN (1, 2, 3, 11) THEN
        v_tasks := v_tasks || COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'task_id', ptn_id,
                'task_type', 'PETITIONS',
                'task_title', 'Petición: ' || ptn_type,
                'task_description', ptn_observation,
                'task_icon', 'pending_actions',
                'task_icon_color', 'info',
                'task_key_id', ptn_id
            ))
            FROM petitions
            WHERE ptn_state IN ('PENDING', 'PENDIENTE', 'EN PROCESO')
        ), '[]'::JSONB);
    END IF;

    -- 3. Cumpleaños de hoy (Para RRHH, Admin, Estudio)
    IF v_prof_id IN (1, 2, 3, 6, 11) THEN
        v_tasks := v_tasks || COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'task_id', user_id,
                'task_type', 'BIRTHDAYS',
                'task_title', 'Cumpleaños hoy: ' || user_name || ' ' || user_surname,
                'task_description', '¡Felicítalo en su día!',
                'task_icon', 'cake',
                'task_icon_color', 'pink',
                'task_key_id', user_id
            ))
            FROM users
            WHERE TO_CHAR(user_birthdate, 'MMDD') = TO_CHAR(NOW(), 'MMDD')
            AND user_active = true
            AND (v_std_id IS NULL OR std_id = v_std_id)
        ), '[]'::JSONB);
    END IF;

    -- 4. Datos bancarios faltantes (Para Admin, Estudio, RRHH)
    IF v_prof_id IN (1, 2, 3, 6, 11) THEN
        v_tasks := v_tasks || COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'task_id', user_id,
                'task_type', 'MISSING_BANK_INFO',
                'task_title', 'Datos bancarios faltantes: ' || user_name || ' ' || user_surname,
                'task_description', 'El usuario no tiene información bancaria registrada.',
                'task_icon', 'account_balance',
                'task_icon_color', 'negative',
                'task_key_id', user_id
            ))
            FROM users
            WHERE (user_bank_entity IS NULL OR user_bank_account IS NULL)
            AND user_active = true
            AND prof_id IN (4, 5) -- Solo para modelos
            AND (v_std_id IS NULL OR std_id = v_std_id)
        ), '[]'::JSONB);
    END IF;

    -- 5. Modelos activas sin contrato activo (Para RRHH, Admin, Estudio)
    IF v_prof_id IN (1, 2, 3, 6, 11) THEN
        v_tasks := v_tasks || COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'task_id', u.user_id,
                'task_type', 'CONTRACTS',
                'task_title', 'Contrato faltante/vencido: ' || u.user_name || ' ' || u.user_surname,
                'task_description', 'El modelo no tiene un contrato activo vinculado.',
                'task_icon', 'description',
                'task_icon_color', 'orange',
                'task_key_id', u.user_id
            ))
            FROM users u
            LEFT JOIN studios_models sm ON sm.user_id_model = u.user_id AND sm.stdmod_active = true
            WHERE u.prof_id IN (4, 5)
            AND u.user_active = true
            AND sm.stdmod_id IS NULL
            AND (v_std_id IS NULL OR u.std_id = v_std_id)
        ), '[]'::JSONB);
    END IF;

    RETURN v_tasks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for petition_states updated_at
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'petition_states') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS set_petition_states_updated_at ON petition_states';
    EXECUTE 'CREATE TRIGGER set_petition_states_updated_at BEFORE UPDATE ON petition_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;
END $$;
