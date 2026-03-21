import { MigrationInterface, QueryRunner } from 'typeorm';
import { configureMigrationSchema } from './migration-schema';

export class AddPayroll1710000008000 implements MigrationInterface {
  name = 'AddPayroll1710000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`CREATE TYPE payroll_period_status_enum AS ENUM ('draft', 'calculated', 'closed')`);
    await queryRunner.query(`
      CREATE TABLE payroll_periods (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        code VARCHAR(80) NOT NULL,
        label VARCHAR(180) NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        status payroll_period_status_enum NOT NULL DEFAULT 'draft',
        notes TEXT NULL,
        last_calculated_at TIMESTAMPTZ NULL,
        closed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL,
        CONSTRAINT uq_payroll_periods_company_branch_code UNIQUE (company_id, branch_id, code)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE payroll_runs (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        period_id INT NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
        run_number INT NOT NULL,
        totals JSONB NOT NULL,
        items JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_payroll_periods_company_branch_start ON payroll_periods(company_id, branch_id, period_start DESC)`);
    await queryRunner.query(`CREATE INDEX idx_payroll_runs_period_id ON payroll_runs(period_id, run_number DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`DROP TABLE IF EXISTS payroll_runs`);
    await queryRunner.query(`DROP TABLE IF EXISTS payroll_periods`);
    await queryRunner.query(`DROP TYPE IF EXISTS payroll_period_status_enum`);
  }
}
