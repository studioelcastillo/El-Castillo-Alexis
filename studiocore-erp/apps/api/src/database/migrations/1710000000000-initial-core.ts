import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialCore1710000000000 implements MigrationInterface {
  name = 'InitialCore1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE record_status_enum AS ENUM ('active', 'inactive')`);
    await queryRunner.query(`CREATE TYPE user_status_enum AS ENUM ('active', 'inactive', 'blocked')`);

    await queryRunner.query(`
      CREATE TABLE companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        legal_name VARCHAR(200) NOT NULL,
        tax_id VARCHAR(50),
        email VARCHAR(150),
        phone VARCHAR(50),
        status record_status_enum NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE branches (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) NOT NULL,
        city VARCHAR(100),
        address VARCHAR(255),
        phone VARCHAR(50),
        status record_status_enum NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL,
        CONSTRAINT uq_branches_company_code UNIQUE (company_id, code)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        default_branch_id INT NULL REFERENCES branches(id) ON DELETE SET NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        avatar_url VARCHAR(255),
        status user_status_enum NOT NULL DEFAULT 'active',
        last_login_at TIMESTAMPTZ NULL,
        must_change_password BOOLEAN NOT NULL DEFAULT false,
        mfa_enabled BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE roles (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        name VARCHAR(120) NOT NULL,
        description TEXT NULL,
        is_system BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_roles_company_name UNIQUE (company_id, name)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE permissions (
        id SERIAL PRIMARY KEY,
        module_key VARCHAR(100) NOT NULL,
        action_key VARCHAR(100) NOT NULL,
        description VARCHAR(150) NOT NULL,
        CONSTRAINT uq_permissions_module_action UNIQUE (module_key, action_key)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE role_permissions (
        id SERIAL PRIMARY KEY,
        role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        CONSTRAINT uq_role_permissions_role_permission UNIQUE (role_id, permission_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_roles (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        branch_id INT NULL REFERENCES branches(id) ON DELETE SET NULL,
        CONSTRAINT uq_user_roles_user_role_branch UNIQUE NULLS NOT DISTINCT (user_id, role_id, branch_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id BIGSERIAL PRIMARY KEY,
        company_id INT NULL REFERENCES companies(id) ON DELETE SET NULL,
        branch_id INT NULL REFERENCES branches(id) ON DELETE SET NULL,
        user_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
        module VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(100) NULL,
        before_data JSONB NULL,
        after_data JSONB NULL,
        meta JSONB NULL,
        ip_address VARCHAR(100) NULL,
        user_agent VARCHAR(500) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        consumed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_users_company_id ON users(company_id)`);
    await queryRunner.query(`CREATE INDEX idx_users_default_branch_id ON users(default_branch_id)`);
    await queryRunner.query(`CREATE INDEX idx_branches_company_id ON branches(company_id)`);
    await queryRunner.query(`CREATE INDEX idx_roles_company_id ON roles(company_id)`);
    await queryRunner.query(`CREATE INDEX idx_user_roles_user_id ON user_roles(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_user_roles_branch_id ON user_roles(branch_id)`);
    await queryRunner.query(`CREATE INDEX idx_audit_logs_company_branch_created ON audit_logs(company_id, branch_id, created_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS password_reset_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TABLE IF EXISTS branches`);
    await queryRunner.query(`DROP TABLE IF EXISTS companies`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS record_status_enum`);
  }
}
