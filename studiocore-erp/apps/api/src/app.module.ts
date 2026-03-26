import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { config as loadEnv } from 'dotenv';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDataSourceOptions } from './database/database.config';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AbsencesModule } from './modules/absences/absences.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CatalogsModule } from './modules/catalogs/catalogs.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { GoalsModule } from './modules/goals/goals.module';
import { HealthModule } from './modules/health/health.module';
import { HrModule } from './modules/hr/hr.module';
import { ModelsModule } from './modules/models/models.module';
import { OnlineTimeModule } from './modules/online-time/online-time.module';
import { OperationsModule } from './modules/operations/operations.module';
import { PeopleModule } from './modules/people/people.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { PayrollNoveltiesModule } from './modules/payroll-novelties/payroll-novelties.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { StaffModule } from './modules/staff/staff.module';
import { UsersModule } from './modules/users/users.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ScrapingModule } from './modules/scraping/scraping.module';

for (const candidate of [resolve(process.cwd(), '.env'), resolve(__dirname, '../../../.env')]) {
  if (existsSync(candidate)) {
    loadEnv({ path: candidate, quiet: true });
    break;
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => getDataSourceOptions(),
    }),
    HealthModule,
    AuditLogsModule,
    AbsencesModule,
    AttendanceModule,
    AuthModule,
    CatalogsModule,
    CompaniesModule,
    GoalsModule,
    HrModule,
    BranchesModule,
    PeopleModule,
    ModelsModule,
    OnlineTimeModule,
    OperationsModule,
    PayrollModule,
    PayrollNoveltiesModule,
    StaffModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    FinanceModule,
    ScrapingModule,
  ],
})
export class AppModule {}
