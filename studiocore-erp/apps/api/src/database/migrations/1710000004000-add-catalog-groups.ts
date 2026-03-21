import { MigrationInterface, QueryRunner } from 'typeorm';
import { configureMigrationSchema } from './migration-schema';

export class AddCatalogGroups1710000004000 implements MigrationInterface {
  name = 'AddCatalogGroups1710000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`
      CREATE TABLE catalog_groups (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        key VARCHAR(120) NOT NULL,
        label VARCHAR(160) NOT NULL,
        description TEXT NULL,
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL,
        CONSTRAINT uq_catalog_groups_company_key UNIQUE (company_id, key)
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_catalog_groups_company_id ON catalog_groups(company_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`DROP TABLE IF EXISTS catalog_groups`);
  }
}
