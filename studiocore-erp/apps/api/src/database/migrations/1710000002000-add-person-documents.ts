import { MigrationInterface, QueryRunner } from 'typeorm';
import { configureMigrationSchema } from './migration-schema';

export class AddPersonDocuments1710000002000 implements MigrationInterface {
  name = 'AddPersonDocuments1710000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`
      CREATE TABLE person_documents (
        id SERIAL PRIMARY KEY,
        person_id INT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NULL REFERENCES branches(id) ON DELETE SET NULL,
        label VARCHAR(120) NOT NULL,
        document_type VARCHAR(80) NOT NULL,
        document_number VARCHAR(80),
        issued_at DATE NULL,
        expires_at DATE NULL,
        status record_status_enum NOT NULL DEFAULT 'active',
        notes TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_person_documents_person_id ON person_documents(person_id)`);
    await queryRunner.query(`CREATE INDEX idx_person_documents_company_id ON person_documents(company_id)`);
    await queryRunner.query(`CREATE INDEX idx_person_documents_branch_status ON person_documents(branch_id, status)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`DROP TABLE IF EXISTS person_documents`);
  }
}
