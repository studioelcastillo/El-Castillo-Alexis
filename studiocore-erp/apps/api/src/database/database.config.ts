import { DataSourceOptions } from 'typeorm';
import { AbsenceRecordEntity } from './entities/absence-record.entity';
import { InitialCore1710000000000 } from './migrations/1710000000000-initial-core';
import { AuditLog } from './entities/audit-log.entity';
import { AttendanceRecordEntity } from './entities/attendance-record.entity';
import { Branch } from './entities/branch.entity';
import { CatalogGroup } from './entities/catalog-group.entity';
import { Company } from './entities/company.entity';
import { GoalRecordEntity } from './entities/goal-record.entity';
import { HrIncapacity } from './entities/hr-incapacity.entity';
import { HrDisciplinaryAction } from './entities/hr-disciplinary-action.entity';
import { HrVacation } from './entities/hr-vacation.entity';
import { OnlineSession } from './entities/online-session.entity';
import { OperationShift } from './entities/operation-shift.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PersonContract } from './entities/person-contract.entity';
import { Person } from './entities/person.entity';
import { PersonDocument } from './entities/person-document.entity';
import { Permission } from './entities/permission.entity';
import { PayrollPeriod } from './entities/payroll-period.entity';
import { PayrollNovelty } from './entities/payroll-novelty.entity';
import { PayrollRun } from './entities/payroll-run.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { User } from './entities/user.entity';
import { FinancialAccount } from './entities/financial-account.entity';
import { FinancialTransaction } from './entities/financial-transaction.entity';
import { AddPeople1710000001000 } from './migrations/1710000001000-add-people';
import { AddPersonDocuments1710000002000 } from './migrations/1710000002000-add-person-documents';
import { AlignPeopleWithSupabase1710000003000 } from './migrations/1710000003000-align-people-with-supabase';
import { AddCatalogGroups1710000004000 } from './migrations/1710000004000-add-catalog-groups';
import { AddOperationsAndAttendance1710000005000 } from './migrations/1710000005000-add-operations-and-attendance';
import { AddAbsencesAndGoals1710000006000 } from './migrations/1710000006000-add-absences-and-goals';
import { AddOnlineSessions1710000007000 } from './migrations/1710000007000-add-online-sessions';
import { AddPayroll1710000008000 } from './migrations/1710000008000-add-payroll';
import { AddPayrollNovelties1710000009000 } from './migrations/1710000009000-add-payroll-novelties';
import { AddHrBase1710000010000 } from './migrations/1710000010000-add-hr-base';
import { AddHrDisciplinaryActions1710000011000 } from './migrations/1710000011000-add-hr-disciplinary-actions';
import { AddFinanceModule1710000012000 } from './migrations/1710000012000-add-finance-module';
import { AddFinanceControls1710000013000 } from './migrations/1710000013000-add-finance-controls';

function resolveDatabaseUrl() {
  const fallbackUrl = 'postgresql://postgres:postgres@localhost:5432/studiocore';
  const rawUrl = process.env.DATABASE_URL || fallbackUrl;
  const schema = process.env.DATABASE_SCHEMA?.trim();

  if (!schema) {
    return rawUrl;
  }

  const url = new URL(rawUrl);
  url.searchParams.set('options', `-csearch_path=${schema}`);
  return url.toString();
}

export const getDataSourceOptions = (): DataSourceOptions => ({
  type: 'postgres',
  url: resolveDatabaseUrl(),
  schema: process.env.DATABASE_SCHEMA || 'public',
  entities: [
    Company,
    Branch,
    CatalogGroup,
    OperationShift,
    OnlineSession,
    AttendanceRecordEntity,
    AbsenceRecordEntity,
    GoalRecordEntity,
    PayrollPeriod,
    PayrollNovelty,
    PayrollRun,
    HrIncapacity,
    HrDisciplinaryAction,
    HrVacation,
    Person,
    PersonContract,
    PersonDocument,
    User,
    Role,
    Permission,
    UserRole,
    RolePermission,
    AuditLog,
    RefreshToken,
    PasswordResetToken,
    FinancialAccount,
    FinancialTransaction,
  ],
  migrations: [
    InitialCore1710000000000,
    AddPeople1710000001000,
    AddPersonDocuments1710000002000,
    AlignPeopleWithSupabase1710000003000,
    AddCatalogGroups1710000004000,
    AddOperationsAndAttendance1710000005000,
    AddAbsencesAndGoals1710000006000,
    AddOnlineSessions1710000007000,
    AddPayroll1710000008000,
    AddPayrollNovelties1710000009000,
    AddHrBase1710000010000,
    AddHrDisciplinaryActions1710000011000,
    AddFinanceModule1710000012000,
    AddFinanceControls1710000013000,
  ],
  synchronize: false,
  logging: false,
});
