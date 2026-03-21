import { MigrationInterface, QueryRunner } from 'typeorm';
import { configureMigrationSchema } from './migration-schema';

export class AddAbsencesAndGoals1710000006000 implements MigrationInterface {
  name = 'AddAbsencesAndGoals1710000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`CREATE TYPE absence_status_enum AS ENUM ('reported', 'approved', 'rejected')`);
    await queryRunner.query(`CREATE TYPE goal_status_enum AS ENUM ('draft', 'active', 'closed')`);

    await queryRunner.query(`
      CREATE TABLE absence_records (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        person_id INT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
        shift_id INT NULL REFERENCES operation_shifts(id) ON DELETE SET NULL,
        starts_at TIMESTAMPTZ NOT NULL,
        ends_at TIMESTAMPTZ NULL,
        reason VARCHAR(180) NOT NULL,
        status absence_status_enum NOT NULL DEFAULT 'reported',
        support_url VARCHAR(500) NULL,
        notes TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE goal_records (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        person_id INT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
        shift_id INT NULL REFERENCES operation_shifts(id) ON DELETE SET NULL,
        title VARCHAR(180) NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        target_amount NUMERIC(12, 2) NOT NULL,
        achieved_amount NUMERIC(12, 2) NULL,
        bonus_amount NUMERIC(12, 2) NULL,
        status goal_status_enum NOT NULL DEFAULT 'draft',
        notes TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_absence_records_company_branch_start ON absence_records(company_id, branch_id, starts_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_absence_records_person_start ON absence_records(person_id, starts_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_goal_records_company_branch_period ON goal_records(company_id, branch_id, period_start DESC)`);
    await queryRunner.query(`CREATE INDEX idx_goal_records_person_period ON goal_records(person_id, period_start DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`DROP TABLE IF EXISTS goal_records`);
    await queryRunner.query(`DROP TABLE IF EXISTS absence_records`);
    await queryRunner.query(`DROP TYPE IF EXISTS goal_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS absence_status_enum`);
  }
}
