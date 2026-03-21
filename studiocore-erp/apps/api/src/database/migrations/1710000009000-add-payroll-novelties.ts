import { MigrationInterface, QueryRunner } from 'typeorm';
import { configureMigrationSchema } from './migration-schema';

export class AddPayrollNovelties1710000009000 implements MigrationInterface {
  name = 'AddPayrollNovelties1710000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`CREATE TYPE payroll_novelty_type_enum AS ENUM ('bonus', 'deduction', 'allowance', 'incident')`);
    await queryRunner.query(`CREATE TYPE payroll_novelty_status_enum AS ENUM ('pending', 'approved', 'rejected')`);
    await queryRunner.query(`
      CREATE TABLE payroll_novelties (
        id SERIAL PRIMARY KEY,
        period_id INT NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        person_id INT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
        novelty_type payroll_novelty_type_enum NOT NULL,
        title VARCHAR(180) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        effective_date DATE NOT NULL,
        status payroll_novelty_status_enum NOT NULL DEFAULT 'pending',
        is_critical BOOLEAN NOT NULL DEFAULT FALSE,
        notes TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_payroll_novelties_period_id ON payroll_novelties(period_id)`);
    await queryRunner.query(`CREATE INDEX idx_payroll_novelties_person_id ON payroll_novelties(person_id)`);
    await queryRunner.query(`CREATE INDEX idx_payroll_novelties_branch_status ON payroll_novelties(branch_id, status)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`DROP TABLE IF EXISTS payroll_novelties`);
    await queryRunner.query(`DROP TYPE IF EXISTS payroll_novelty_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS payroll_novelty_type_enum`);
  }
}
