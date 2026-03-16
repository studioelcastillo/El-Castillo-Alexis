import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { CORE_PERMISSION_SEEDS } from '../common/constants/permission-catalog';
import { hashPassword } from '../common/utils/security';
import { Branch } from './entities/branch.entity';
import { Company } from './entities/company.entity';
import { RecordStatus, UserStatus } from './entities/enums';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { User } from './entities/user.entity';

async function seed() {
  await AppDataSource.initialize();

  const companyRepository = AppDataSource.getRepository(Company);
  const branchRepository = AppDataSource.getRepository(Branch);
  const permissionRepository = AppDataSource.getRepository(Permission);
  const roleRepository = AppDataSource.getRepository(Role);
  const rolePermissionRepository = AppDataSource.getRepository(RolePermission);
  const userRepository = AppDataSource.getRepository(User);
  const userRoleRepository = AppDataSource.getRepository(UserRole);

  let company = await companyRepository.findOne({ where: { name: 'StudioCore Demo' } });
  if (!company) {
    company = await companyRepository.save(
      companyRepository.create({
        name: 'StudioCore Demo',
        legalName: 'StudioCore Demo SAS',
        taxId: '900000001',
        email: 'demo@studiocore.local',
        phone: '3000000000',
        status: RecordStatus.ACTIVE,
      }),
    );
  }

  let mainBranch = await branchRepository.findOne({ where: { companyId: company.id, code: 'HQ' } });
  if (!mainBranch) {
    mainBranch = await branchRepository.save(
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
  }

  let northBranch = await branchRepository.findOne({ where: { companyId: company.id, code: 'NORTH' } });
  if (!northBranch) {
    northBranch = await branchRepository.save(
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
  }

  for (const permissionSeed of CORE_PERMISSION_SEEDS) {
    const existing = await permissionRepository.findOne({
      where: { moduleKey: permissionSeed.moduleKey, actionKey: permissionSeed.actionKey },
    });
    if (!existing) {
      await permissionRepository.save(permissionRepository.create(permissionSeed));
    }
  }

  const allPermissions = await permissionRepository.find();

  let ownerRole = await roleRepository.findOne({ where: { companyId: company.id, name: 'Owner' } });
  if (!ownerRole) {
    ownerRole = await roleRepository.save(
      roleRepository.create({
        companyId: company.id,
        name: 'Owner',
        description: 'Acceso total a la empresa demo',
        isSystem: true,
      }),
    );
  }

  let adminRole = await roleRepository.findOne({ where: { companyId: company.id, name: 'Admin General' } });
  if (!adminRole) {
    adminRole = await roleRepository.save(
      roleRepository.create({
        companyId: company.id,
        name: 'Admin General',
        description: 'Administracion operativa general',
        isSystem: true,
      }),
    );
  }

  let auditorRole = await roleRepository.findOne({ where: { companyId: company.id, name: 'Auditor' } });
  if (!auditorRole) {
    auditorRole = await roleRepository.save(
      roleRepository.create({
        companyId: company.id,
        name: 'Auditor',
        description: 'Consulta y auditoria de informacion',
        isSystem: true,
      }),
    );
  }

  const ownerPermissionIds = allPermissions.map((permission) => permission.id);
  const auditorPermissionIds = allPermissions
    .filter((permission) => ['view', 'export'].includes(permission.actionKey))
    .map((permission) => permission.id);

  for (const [role, permissionIds] of [
    [ownerRole, ownerPermissionIds],
    [adminRole, ownerPermissionIds],
    [auditorRole, auditorPermissionIds],
  ] as const) {
    const existingLinks = await rolePermissionRepository.find({ where: { roleId: role.id } });
    if (existingLinks.length !== permissionIds.length) {
      await rolePermissionRepository.delete({ roleId: role.id });
      await rolePermissionRepository.save(
        permissionIds.map((permissionId) =>
          rolePermissionRepository.create({
            roleId: role.id,
            permissionId,
          }),
        ),
      );
    }
  }

  let adminUser = await userRepository.findOne({ where: { email: 'admin@studiocore.local' } });
  if (!adminUser) {
    adminUser = await userRepository.save(
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
  }

  let auditorUser = await userRepository.findOne({ where: { email: 'auditor@studiocore.local' } });
  if (!auditorUser) {
    auditorUser = await userRepository.save(
      userRepository.create({
        companyId: company.id,
        defaultBranchId: northBranch.id,
        firstName: 'Ana',
        lastName: 'Auditora',
        email: 'auditor@studiocore.local',
        passwordHash: await hashPassword('Auditor123*'),
        phone: '3000002222',
        status: UserStatus.ACTIVE,
        mustChangePassword: true,
        mfaEnabled: false,
      }),
    );
  }

  const adminAssignments = await userRoleRepository.find({ where: { userId: adminUser.id } });
  if (!adminAssignments.length) {
    await userRoleRepository.save([
      userRoleRepository.create({ userId: adminUser.id, roleId: ownerRole.id, branchId: null }),
      userRoleRepository.create({ userId: adminUser.id, roleId: adminRole.id, branchId: mainBranch.id }),
    ]);
  }

  const auditorAssignments = await userRoleRepository.find({ where: { userId: auditorUser.id } });
  if (!auditorAssignments.length) {
    await userRoleRepository.save([
      userRoleRepository.create({ userId: auditorUser.id, roleId: auditorRole.id, branchId: northBranch.id }),
    ]);
  }

  await AppDataSource.destroy();
  process.stdout.write('Database seeded successfully\n');
}

seed().catch(async (error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
