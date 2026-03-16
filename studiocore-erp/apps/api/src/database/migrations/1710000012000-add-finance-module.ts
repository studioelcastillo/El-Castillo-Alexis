import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFinanceModule1710000012000 implements MigrationInterface {
  name = 'AddFinanceModule1710000012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE financial_account_type_enum AS ENUM ('bank', 'cash', 'platform', 'other')`);
    await queryRunner.query(`CREATE TYPE financial_transaction_type_enum AS ENUM ('income', 'expense', 'transfer')`);

    await queryRunner.query(`
      CREATE TABLE financial_accounts (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        name VARCHAR(180) NOT NULL,
        type financial_account_type_enum NOT NULL DEFAULT 'bank',
        currency VARCHAR(10) NOT NULL DEFAULT 'COP',
        balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
        bank_name VARCHAR(180) NULL,
        account_number VARCHAR(100) NULL,
        notes TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE financial_transactions (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        account_id INT NOT NULL REFERENCES financial_accounts(id) ON DELETE RESTRICT,
        type financial_transaction_type_enum NOT NULL,
        amount NUMERIC(15, 2) NOT NULL,
        transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        description TEXT NOT NULL,
        person_id INT NULL REFERENCES people(id) ON DELETE SET NULL,
        related_entity_type VARCHAR(100) NULL,
        related_entity_id VARCHAR(100) NULL,
        created_by_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_financial_accounts_company ON financial_accounts(company_id)`);
    await queryRunner.query(`CREATE INDEX idx_financial_accounts_branch ON financial_accounts(branch_id) WHERE branch_id IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX idx_financial_transactions_account ON financial_transactions(account_id)`);
    await queryRunner.query(`CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS financial_transactions`);
    await queryRunner.query(`DROP TABLE IF EXISTS financial_accounts`);
    await queryRunner.query(`DROP TYPE IF EXISTS financial_transaction_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS financial_account_type_enum`);
  }
}
