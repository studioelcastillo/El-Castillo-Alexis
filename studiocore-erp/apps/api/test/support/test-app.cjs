const { ValidationPipe, Module } = require('@nestjs/common');
const { ConfigModule } = require('@nestjs/config');
const { Test } = require('@nestjs/testing');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { DataType, newDb } = require('pg-mem');
const supertest = require('supertest');
const { DataSource } = require('typeorm');
const { CORE_PERMISSION_SEEDS } = require('../../dist/common/constants/permission-catalog');
const { hashPassword } = require('../../dist/common/utils/security');
const { AuditLog } = require('../../dist/database/entities/audit-log.entity');
const { AbsenceRecordEntity } = require('../../dist/database/entities/absence-record.entity');
const { AttendanceRecordEntity } = require('../../dist/database/entities/attendance-record.entity');
const { Branch } = require('../../dist/database/entities/branch.entity');
const { CatalogGroup } = require('../../dist/database/entities/catalog-group.entity');
const { Company } = require('../../dist/database/entities/company.entity');
const { GoalRecordEntity } = require('../../dist/database/entities/goal-record.entity');
const { FinancialAccount } = require('../../dist/database/entities/financial-account.entity');
const { FinancialTransaction } = require('../../dist/database/entities/financial-transaction.entity');
const { HrDisciplinaryAction } = require('../../dist/database/entities/hr-disciplinary-action.entity');
const { HrIncapacity } = require('../../dist/database/entities/hr-incapacity.entity');
const { HrVacation } = require('../../dist/database/entities/hr-vacation.entity');
const { OnlineSession } = require('../../dist/database/entities/online-session.entity');
const { OperationShift } = require('../../dist/database/entities/operation-shift.entity');
const { PasswordResetToken } = require('../../dist/database/entities/password-reset-token.entity');
const { Permission } = require('../../dist/database/entities/permission.entity');
const { PayrollPeriod } = require('../../dist/database/entities/payroll-period.entity');
const { PayrollNovelty } = require('../../dist/database/entities/payroll-novelty.entity');
const { PayrollRun } = require('../../dist/database/entities/payroll-run.entity');
const { Person } = require('../../dist/database/entities/person.entity');
const { PersonContract } = require('../../dist/database/entities/person-contract.entity');
const { PersonDocument } = require('../../dist/database/entities/person-document.entity');
const { RefreshToken } = require('../../dist/database/entities/refresh-token.entity');
const { RolePermission } = require('../../dist/database/entities/role-permission.entity');
const { Role } = require('../../dist/database/entities/role.entity');
const { RecordStatus, UserStatus } = require('../../dist/database/entities/enums');
const { UserRole } = require('../../dist/database/entities/user-role.entity');
const { User } = require('../../dist/database/entities/user.entity');
const { AuditLogsModule } = require('../../dist/modules/audit-logs/audit-logs.module');
const { AbsencesModule } = require('../../dist/modules/absences/absences.module');
const { AttendanceModule } = require('../../dist/modules/attendance/attendance.module');
const { AuthModule } = require('../../dist/modules/auth/auth.module');
const { BranchesModule } = require('../../dist/modules/branches/branches.module');
const { CatalogsModule } = require('../../dist/modules/catalogs/catalogs.module');
const { CompaniesModule } = require('../../dist/modules/companies/companies.module');
const { GoalsModule } = require('../../dist/modules/goals/goals.module');
const { FinanceModule } = require('../../dist/modules/finance/finance.module');
const { HrModule } = require('../../dist/modules/hr/hr.module');
const { ModelsModule } = require('../../dist/modules/models/models.module');
const { OnlineTimeModule } = require('../../dist/modules/online-time/online-time.module');
const { OperationsModule } = require('../../dist/modules/operations/operations.module');
const { PayrollModule } = require('../../dist/modules/payroll/payroll.module');
const { PayrollNoveltiesModule } = require('../../dist/modules/payroll-novelties/payroll-novelties.module');
const { PeopleModule } = require('../../dist/modules/people/people.module');
const { PermissionsModule } = require('../../dist/modules/permissions/permissions.module');
const { RolesModule } = require('../../dist/modules/roles/roles.module');
const { StaffModule } = require('../../dist/modules/staff/staff.module');
const { UsersModule } = require('../../dist/modules/users/users.module');
const { ObjectStorageService } = require('../../dist/common/services/object-storage.service');

const entities = [
  Company,
  Branch,
  CatalogGroup,
  OperationShift,
  OnlineSession,
  PayrollPeriod,
  PayrollNovelty,
  PayrollRun,
  HrDisciplinaryAction,
  HrIncapacity,
  HrVacation,
  AbsenceRecordEntity,
  GoalRecordEntity,
  FinancialAccount,
  FinancialTransaction,
  AttendanceRecordEntity,
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
];

class TestApiModule {}

class FakeObjectStorageService {
  constructor() {
    this.defaultBucket = 'test-documents';
    this.objects = new Map();
  }

  getDefaultBucket() {
    return this.defaultBucket;
  }

  async uploadObject(input) {
    const bucket = input.bucket || this.defaultBucket;
    this.objects.set(`${bucket}:${input.key}`, {
      body: input.body,
      contentDisposition: input.contentDisposition || null,
      contentType: input.contentType || null,
    });

    return {
      bucket,
      key: input.key,
      publicUrl: `https://storage.studiocore.local/${bucket}/${input.key}`,
    };
  }

  async getSignedObjectUrl(bucket, key) {
    if (!bucket || !key) {
      throw new Error('Storage bucket and path are required');
    }

    if (!this.objects.has(`${bucket}:${key}`)) {
      throw new Error(`Object ${bucket}/${key} was not uploaded in test storage`);
    }

    return `https://signed.storage.studiocore.local/${bucket}/${key}?signature=test`;
  }
}

Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        entities,
        synchronize: true,
        logging: false,
      }),
      dataSourceFactory: async (options) => {
        const db = newDb({ autoCreateForeignKeyIndices: true });
        db.public.registerFunction({ name: 'current_database', returns: DataType.text, implementation: () => 'studiocore_test' });
        db.public.registerFunction({ name: 'current_schema', returns: DataType.text, implementation: () => 'public' });
        db.public.registerFunction({ name: 'version', returns: DataType.text, implementation: () => 'PostgreSQL 16.0' });

        const dataSource = db.adapters.createTypeormDataSource(options);
        await dataSource.initialize();
        return dataSource;
      },
    }),
    AuditLogsModule,
    AbsencesModule,
    AttendanceModule,
    AuthModule,
    CatalogsModule,
    CompaniesModule,
    FinanceModule,
    GoalsModule,
    HrModule,
    BranchesModule,
    OperationsModule,
    OnlineTimeModule,
    PayrollModule,
    PayrollNoveltiesModule,
    PeopleModule,
    ModelsModule,
    StaffModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
  ],
})(TestApiModule);

async function createTestContext() {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.JWT_ACCESS_TTL = '15m';
  process.env.JWT_REFRESH_TTL = '7d';

  const fakeObjectStorageService = new FakeObjectStorageService();
  const moduleRef = await Test.createTestingModule({ imports: [TestApiModule] })
    .overrideProvider(ObjectStorageService)
    .useValue(fakeObjectStorageService)
    .compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  const dataSource = moduleRef.get(DataSource);
  const seeded = await seedCoreData(dataSource);
  const request = supertest(app.getHttpServer());
  const loginResponse = await request.post('/api/v1/auth/login').send({
    email: 'admin@studiocore.local',
    password: 'Admin123*',
  });
  const branchScopedLoginResponse = await request.post('/api/v1/auth/login').send({
    email: 'branch.manager@studiocore.local',
    password: 'Branch123*',
    branchId: seeded.mainBranch.id,
  });

  return {
    app,
    dataSource,
    request,
    authHeader: `Bearer ${loginResponse.body.tokens.accessToken}`,
    branchScopedAuthHeader: `Bearer ${branchScopedLoginResponse.body.tokens.accessToken}`,
    primaryCompanyId: seeded.company.id,
    primaryBranchId: seeded.mainBranch.id,
    secondaryBranchId: seeded.secondaryBranch.id,
    ownerRoleId: seeded.ownerRole.id,
    adminUserId: seeded.adminUser.id,
    branchScopedUserId: seeded.branchScopedUser.id,
    objectStorage: fakeObjectStorageService,
  };
}

async function closeTestContext(context) {
  await context.app.close();
}

async function seedCoreData(dataSource) {
  const companyRepository = dataSource.getRepository(Company);
  const branchRepository = dataSource.getRepository(Branch);
  const permissionRepository = dataSource.getRepository(Permission);
  const roleRepository = dataSource.getRepository(Role);
  const rolePermissionRepository = dataSource.getRepository(RolePermission);
  const userRepository = dataSource.getRepository(User);
  const userRoleRepository = dataSource.getRepository(UserRole);

  const company = await companyRepository.save(
    companyRepository.create({
      name: 'StudioCore Demo',
      legalName: 'StudioCore Demo SAS',
      taxId: '900000001',
      email: 'demo@studiocore.local',
      phone: '3000000000',
      status: RecordStatus.ACTIVE,
    }),
  );

  const mainBranch = await branchRepository.save(
    branchRepository.create({
      companyId: company.id,
      name: 'Sede Principal',
      code: 'HQ',
      city: 'Bogota',
      address: 'Calle Principal 123',
      phone: '6010000000',
      status: RecordStatus.ACTIVE,
    }),
  );

  const secondaryBranch = await branchRepository.save(
    branchRepository.create({
      companyId: company.id,
      name: 'Sede Norte',
      code: 'NORTH',
      city: 'Bogota',
      address: 'Avenida Norte 456',
      phone: '6010000001',
      status: RecordStatus.ACTIVE,
    }),
  );

  const permissions = await permissionRepository.save(
    CORE_PERMISSION_SEEDS.map((permissionSeed) => permissionRepository.create(permissionSeed)),
  );

  const ownerRole = await roleRepository.save(
    roleRepository.create({
      companyId: company.id,
      name: 'Owner',
      description: 'Acceso total en entorno de pruebas',
      isSystem: true,
    }),
  );

  await rolePermissionRepository.save(
    permissions.map((permission) =>
      rolePermissionRepository.create({
        roleId: ownerRole.id,
        permissionId: permission.id,
      }),
    ),
  );

  const adminUser = await userRepository.save(
    userRepository.create({
      companyId: company.id,
      defaultBranchId: mainBranch.id,
      firstName: 'Alexis',
      lastName: 'Admin',
      email: 'admin@studiocore.local',
      passwordHash: await hashPassword('Admin123*'),
      phone: '3000001111',
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      mfaEnabled: false,
    }),
  );

  await userRoleRepository.save(
    userRoleRepository.create({
      userId: adminUser.id,
      roleId: ownerRole.id,
      branchId: null,
    }),
  );

  const branchScopedUser = await userRepository.save(
    userRepository.create({
      companyId: company.id,
      defaultBranchId: mainBranch.id,
      firstName: 'Brenda',
      lastName: 'Branch',
      email: 'branch.manager@studiocore.local',
      passwordHash: await hashPassword('Branch123*'),
      phone: '3000002222',
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      mfaEnabled: false,
    }),
  );

  await userRoleRepository.save(
    userRoleRepository.create({
      userId: branchScopedUser.id,
      roleId: ownerRole.id,
      branchId: mainBranch.id,
    }),
  );

  return {
    company,
    mainBranch,
    secondaryBranch,
    ownerRole,
    adminUser,
    branchScopedUser,
  };
}

module.exports = {
  closeTestContext,
  createTestContext,
};
