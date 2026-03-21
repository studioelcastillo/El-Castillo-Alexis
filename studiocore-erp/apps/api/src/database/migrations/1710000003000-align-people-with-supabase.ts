import { MigrationInterface, QueryRunner } from 'typeorm';
import { configureMigrationSchema } from './migration-schema';

export class AlignPeopleWithSupabase1710000003000 implements MigrationInterface {
  name = 'AlignPeopleWithSupabase1710000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`ALTER TABLE people ADD COLUMN IF NOT EXISTS issued_in VARCHAR(120)`);
    await queryRunner.query(`ALTER TABLE people ADD COLUMN IF NOT EXISTS personal_email VARCHAR(150)`);
    await queryRunner.query(`ALTER TABLE people ADD COLUMN IF NOT EXISTS address VARCHAR(220)`);
    await queryRunner.query(`ALTER TABLE people ADD COLUMN IF NOT EXISTS sex VARCHAR(30)`);
    await queryRunner.query(`ALTER TABLE people ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10)`);
    await queryRunner.query(`ALTER TABLE people ADD COLUMN IF NOT EXISTS model_category VARCHAR(40)`);
    await queryRunner.query(`ALTER TABLE people ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500)`);
    await queryRunner.query(`ALTER TABLE people ADD COLUMN IF NOT EXISTS bank_entity VARCHAR(120)`);
    await queryRunner.query(`ALTER TABLE people ADD COLUMN IF NOT EXISTS bank_account_type VARCHAR(30)`);
    await queryRunner.query(`ALTER TABLE people ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(80)`);
    await queryRunner.query(`ALTER TABLE people ADD COLUMN IF NOT EXISTS beneficiary_name VARCHAR(180)`);
    await queryRunner.query(`ALTER TABLE people ADD COLUMN IF NOT EXISTS beneficiary_document VARCHAR(80)`);
    await queryRunner.query(`ALTER TABLE people ADD COLUMN IF NOT EXISTS beneficiary_document_type VARCHAR(50)`);

    await queryRunner.query(`ALTER TABLE person_documents ADD COLUMN IF NOT EXISTS legacy_label VARCHAR(80)`);
    await queryRunner.query(`ALTER TABLE person_documents ADD COLUMN IF NOT EXISTS file_type VARCHAR(40)`);
    await queryRunner.query(`ALTER TABLE person_documents ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(120)`);
    await queryRunner.query(`ALTER TABLE person_documents ADD COLUMN IF NOT EXISTS storage_path VARCHAR(500)`);
    await queryRunner.query(`ALTER TABLE person_documents ADD COLUMN IF NOT EXISTS public_url VARCHAR(500)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS person_contracts (
        id SERIAL PRIMARY KEY,
        person_id INT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NULL REFERENCES branches(id) ON DELETE SET NULL,
        contract_type VARCHAR(80) NOT NULL,
        contract_number VARCHAR(80),
        commission_type VARCHAR(30),
        commission_percent NUMERIC(10, 2),
        goal_amount NUMERIC(12, 2),
        position_name VARCHAR(120),
        area_name VARCHAR(120),
        city_name VARCHAR(120),
        starts_at DATE NOT NULL,
        ends_at DATE NULL,
        monthly_salary NUMERIC(14, 2),
        biweekly_salary NUMERIC(14, 2),
        daily_salary NUMERIC(14, 2),
        uniform_amount NUMERIC(14, 2),
        has_withholding BOOLEAN NOT NULL DEFAULT FALSE,
        has_sena BOOLEAN NOT NULL DEFAULT FALSE,
        has_compensation_box BOOLEAN NOT NULL DEFAULT FALSE,
        has_icbf BOOLEAN NOT NULL DEFAULT FALSE,
        arl_risk_level VARCHAR(5),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_person_contracts_person_id ON person_contracts(person_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_person_contracts_branch_active ON person_contracts(branch_id, is_active)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`DROP TABLE IF EXISTS person_contracts`);
    await queryRunner.query(`ALTER TABLE person_documents DROP COLUMN IF EXISTS public_url`);
    await queryRunner.query(`ALTER TABLE person_documents DROP COLUMN IF EXISTS storage_path`);
    await queryRunner.query(`ALTER TABLE person_documents DROP COLUMN IF EXISTS storage_bucket`);
    await queryRunner.query(`ALTER TABLE person_documents DROP COLUMN IF EXISTS file_type`);
    await queryRunner.query(`ALTER TABLE person_documents DROP COLUMN IF EXISTS legacy_label`);
    await queryRunner.query(`ALTER TABLE people DROP COLUMN IF EXISTS beneficiary_document_type`);
    await queryRunner.query(`ALTER TABLE people DROP COLUMN IF EXISTS beneficiary_document`);
    await queryRunner.query(`ALTER TABLE people DROP COLUMN IF EXISTS beneficiary_name`);
    await queryRunner.query(`ALTER TABLE people DROP COLUMN IF EXISTS bank_account_number`);
    await queryRunner.query(`ALTER TABLE people DROP COLUMN IF EXISTS bank_account_type`);
    await queryRunner.query(`ALTER TABLE people DROP COLUMN IF EXISTS bank_entity`);
    await queryRunner.query(`ALTER TABLE people DROP COLUMN IF EXISTS photo_url`);
    await queryRunner.query(`ALTER TABLE people DROP COLUMN IF EXISTS model_category`);
    await queryRunner.query(`ALTER TABLE people DROP COLUMN IF EXISTS blood_type`);
    await queryRunner.query(`ALTER TABLE people DROP COLUMN IF EXISTS sex`);
    await queryRunner.query(`ALTER TABLE people DROP COLUMN IF EXISTS address`);
    await queryRunner.query(`ALTER TABLE people DROP COLUMN IF EXISTS personal_email`);
    await queryRunner.query(`ALTER TABLE people DROP COLUMN IF EXISTS issued_in`);
  }
}
