import { MigrationInterface, QueryRunner } from 'typeorm';
import { configureMigrationSchema } from './migration-schema';

export class AddHrDisciplinaryActions1710000011000 implements MigrationInterface {
  name = 'AddHrDisciplinaryActions1710000011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`CREATE TYPE hr_disciplinary_action_type_enum AS ENUM ('warning', 'sanction')`);
    await queryRunner.query(`
      CREATE TABLE hr_disciplinary_actions (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        person_id INT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
        action_type hr_disciplinary_action_type_enum NOT NULL,
        title VARCHAR(180) NOT NULL,
        effective_date DATE NOT NULL,
        support_url VARCHAR(500) NULL,
        payroll_impact_amount NUMERIC(12, 2) NULL,
        status hr_request_status_enum NOT NULL DEFAULT 'requested',
        notes TEXT NULL,
        payroll_novelty_id INT NULL REFERENCES payroll_novelties(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_hr_disciplinary_actions_branch_status ON hr_disciplinary_actions(branch_id, status)`);
    await queryRunner.query(`CREATE INDEX idx_hr_disciplinary_actions_person_date ON hr_disciplinary_actions(person_id, effective_date DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`DROP TABLE IF EXISTS hr_disciplinary_actions`);
    await queryRunner.query(`DROP TYPE IF EXISTS hr_disciplinary_action_type_enum`);
  }
}
