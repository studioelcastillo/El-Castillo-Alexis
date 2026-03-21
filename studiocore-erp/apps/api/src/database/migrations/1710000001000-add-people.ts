import { MigrationInterface, QueryRunner } from 'typeorm';
import { configureMigrationSchema } from './migration-schema';

export class AddPeople1710000001000 implements MigrationInterface {
  name = 'AddPeople1710000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`CREATE TYPE person_type_enum AS ENUM ('model', 'staff', 'contractor', 'other')`);

    await queryRunner.query(`
      CREATE TABLE people (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NULL REFERENCES branches(id) ON DELETE SET NULL,
        person_type person_type_enum NOT NULL DEFAULT 'staff',
        first_name VARCHAR(120) NOT NULL,
        last_name VARCHAR(120) NOT NULL,
        document_type VARCHAR(50),
        document_number VARCHAR(80),
        email VARCHAR(150),
        phone VARCHAR(50),
        birth_date DATE NULL,
        status record_status_enum NOT NULL DEFAULT 'active',
        notes TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_people_company_id ON people(company_id)`);
    await queryRunner.query(`CREATE INDEX idx_people_branch_id ON people(branch_id)`);
    await queryRunner.query(`CREATE INDEX idx_people_status_type ON people(status, person_type)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`DROP TABLE IF EXISTS people`);
    await queryRunner.query(`DROP TYPE IF EXISTS person_type_enum`);
  }
}
