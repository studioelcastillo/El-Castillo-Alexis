import { MigrationInterface, QueryRunner } from 'typeorm';
import { configureMigrationSchema } from './migration-schema';

export class AddHrBase1710000010000 implements MigrationInterface {
  name = 'AddHrBase1710000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`CREATE TYPE hr_request_status_enum AS ENUM ('requested', 'approved', 'rejected')`);
    await queryRunner.query(`
      CREATE TABLE hr_incapacities (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        person_id INT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
        reason VARCHAR(180) NOT NULL,
        starts_at DATE NOT NULL,
        ends_at DATE NOT NULL,
        support_url VARCHAR(500) NULL,
        status hr_request_status_enum NOT NULL DEFAULT 'requested',
        notes TEXT NULL,
        payroll_novelty_id INT NULL REFERENCES payroll_novelties(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE hr_vacations (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        person_id INT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
        reason VARCHAR(180) NOT NULL,
        starts_at DATE NOT NULL,
        ends_at DATE NOT NULL,
        is_paid BOOLEAN NOT NULL DEFAULT TRUE,
        status hr_request_status_enum NOT NULL DEFAULT 'requested',
        notes TEXT NULL,
        payroll_novelty_id INT NULL REFERENCES payroll_novelties(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_hr_incapacities_branch_status ON hr_incapacities(branch_id, status)`);
    await queryRunner.query(`CREATE INDEX idx_hr_incapacities_person_dates ON hr_incapacities(person_id, starts_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_hr_vacations_branch_status ON hr_vacations(branch_id, status)`);
    await queryRunner.query(`CREATE INDEX idx_hr_vacations_person_dates ON hr_vacations(person_id, starts_at DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`DROP TABLE IF EXISTS hr_vacations`);
    await queryRunner.query(`DROP TABLE IF EXISTS hr_incapacities`);
    await queryRunner.query(`DROP TYPE IF EXISTS hr_request_status_enum`);
  }
}
