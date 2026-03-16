import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOnlineSessions1710000007000 implements MigrationInterface {
  name = 'AddOnlineSessions1710000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE online_session_status_enum AS ENUM ('open', 'closed', 'cancelled')`);
    await queryRunner.query(`
      CREATE TABLE online_sessions (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        person_id INT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
        shift_id INT NULL REFERENCES operation_shifts(id) ON DELETE SET NULL,
        label VARCHAR(180) NOT NULL,
        platform_name VARCHAR(120) NULL,
        started_at TIMESTAMPTZ NOT NULL,
        ended_at TIMESTAMPTZ NULL,
        token_count INT NULL,
        gross_amount NUMERIC(12, 2) NULL,
        status online_session_status_enum NOT NULL DEFAULT 'open',
        notes TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_online_sessions_company_branch_start ON online_sessions(company_id, branch_id, started_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_online_sessions_person_start ON online_sessions(person_id, started_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_online_sessions_shift_id ON online_sessions(shift_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS online_sessions`);
    await queryRunner.query(`DROP TYPE IF EXISTS online_session_status_enum`);
  }
}
