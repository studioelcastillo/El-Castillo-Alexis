-- Payroll tables (Nomina)

CREATE TABLE IF NOT EXISTS payroll_periods (
  payroll_period_id SERIAL PRIMARY KEY,
  std_id INT REFERENCES studios(std_id) ON DELETE CASCADE,
  payroll_period_start_date DATE NOT NULL,
  payroll_period_end_date DATE NOT NULL,
  payroll_period_state VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
  payroll_period_interval VARCHAR(20) NOT NULL DEFAULT 'MENSUAL',
  payroll_period_smmlv NUMERIC(14,2) DEFAULT 1300000,
  is_auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_concepts (
  payroll_concept_id SERIAL PRIMARY KEY,
  payroll_period_id INT REFERENCES payroll_periods(payroll_period_id) ON DELETE CASCADE,
  stdmod_id INT REFERENCES studios_models(stdmod_id) ON DELETE CASCADE,
  concept_type VARCHAR(50) NOT NULL,
  concept_description TEXT,
  concept_hours NUMERIC(8,2) DEFAULT 0,
  concept_hourly_rate NUMERIC(14,2) DEFAULT 0,
  concept_surcharge_percentage NUMERIC(8,2) DEFAULT 0,
  concept_total NUMERIC(14,2) DEFAULT 0,
  commission_periods JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
