import { MigrationInterface, QueryRunner } from 'typeorm';
import { configureMigrationSchema } from './migration-schema';

export class AddFinanceControls1710000013000 implements MigrationInterface {
  name = 'AddFinanceControls1710000013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`CREATE TYPE financial_transaction_status_enum AS ENUM ('posted', 'voided')`);
    await queryRunner.query(`ALTER TABLE financial_transactions ADD COLUMN status financial_transaction_status_enum NOT NULL DEFAULT 'posted'`);
    await queryRunner.query(`ALTER TABLE financial_transactions ADD COLUMN void_reason TEXT NULL`);
    await queryRunner.query(`ALTER TABLE financial_transactions ADD COLUMN voided_at TIMESTAMPTZ NULL`);
    await queryRunner.query(`ALTER TABLE financial_transactions ADD COLUMN voided_by_id INT NULL REFERENCES users(id) ON DELETE SET NULL`);
    await queryRunner.query(`CREATE INDEX idx_financial_transactions_status ON financial_transactions(status)`);
    await queryRunner.query(`
      CREATE INDEX idx_financial_transactions_relation
      ON financial_transactions(related_entity_type, related_entity_id)
      WHERE related_entity_type IS NOT NULL AND related_entity_id IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await configureMigrationSchema(queryRunner);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_financial_transactions_relation`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_financial_transactions_status`);
    await queryRunner.query(`ALTER TABLE financial_transactions DROP COLUMN IF EXISTS voided_by_id`);
    await queryRunner.query(`ALTER TABLE financial_transactions DROP COLUMN IF EXISTS voided_at`);
    await queryRunner.query(`ALTER TABLE financial_transactions DROP COLUMN IF EXISTS void_reason`);
    await queryRunner.query(`ALTER TABLE financial_transactions DROP COLUMN IF EXISTS status`);
    await queryRunner.query(`DROP TYPE IF EXISTS financial_transaction_status_enum`);
  }
}
