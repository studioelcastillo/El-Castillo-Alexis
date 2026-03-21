import { QueryRunner } from 'typeorm';

function quoteIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function configureMigrationSchema(queryRunner: QueryRunner) {
  const schema = process.env.DATABASE_SCHEMA?.trim();

  if (!schema || schema === 'public') {
    await queryRunner.query('SET search_path TO public');
    return;
  }

  await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(schema)}`);
  await queryRunner.query(`SET search_path TO ${quoteIdentifier(schema)}, public`);
}
