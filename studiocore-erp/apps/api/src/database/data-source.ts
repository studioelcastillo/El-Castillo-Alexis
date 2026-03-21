import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { getDataSourceOptions } from './database.config';

for (const candidate of [resolve(process.cwd(), '.env'), resolve(__dirname, '../../../../.env')]) {
  if (existsSync(candidate)) {
    loadEnv({ path: candidate, quiet: true });
    break;
  }
}

export const AppDataSource = new DataSource(getDataSourceOptions());
