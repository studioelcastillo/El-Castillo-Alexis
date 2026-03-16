import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { resolveActiveBranchId } from '../../common/utils/tenant-scope';
import {
  generateTemporaryPassword,
  hashPassword,
} from '../../common/utils/security';
import { Branch } from '../../database/entities/branch.entity';
import { Role } from '../../database/entities/role.entity';
import { UserStatus } from '../../database/entities/enums';
import { UserRole } from '../../database/entities/user-role.entity';
import { User } from '../../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async list(currentUser: CurrentUserContext, query: UsersQueryDto) {
    const qb = this.userRepository.createQueryBuilder('user');
    qb.where('user.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('user.deleted_at IS NULL');

    if (query.status) {
      qb.andWhere('user.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('user.created_at', 'DESC');

    const users = await qb.getMany();

    const hydratedUsers = await Promise.all(users.map((user) => this.findByIdWithSecurityContext(user.id)));
    const scopedUsers = hydratedUsers
      .filter((user): user is User => Boolean(user))
      .filter((user) => this.isUserWithinScope(currentUser, user));
    const items = scopedUsers
      .slice((query.page - 1) * query.pageSize, query.page * query.pageSize)
      .map((user) => this.serializeManagedUser(user));
    return { items, total: scopedUsers.length, page: query.page, pageSize: query.pageSize };
  }

  async findOne(currentUser: CurrentUserContext, id: number) {
    const user = await this.findByIdWithSecurityContext(id);
    this.assertUserWithinScope(currentUser, user, 'User not found');
    return { data: this.serializeManagedUser(user) };
  }

  async create(currentUser: CurrentUserContext, dto: CreateUserDto, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    const email = dto.email.toLowerCase();
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing && !existing.deletedAt) {
      throw new BadRequestException('Email is already registered');
    }

    const normalizedRoleAssignments = this.normalizeAssignmentsForScope(currentUser, dto.roleAssignments);
    const normalizedDefaultBranchId = this.normalizeDefaultBranchId(
      currentUser,
      dto.defaultBranchId,
      currentUser.hasCompanyWideAccess ? null : resolveActiveBranchId(currentUser),
    );

    await this.validateAssignments(currentUser.companyId, normalizedDefaultBranchId, normalizedRoleAssignments);

    const createdUser = await this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(User).save(
        manager.getRepository(User).create({
          companyId: currentUser.companyId,
          defaultBranchId: normalizedDefaultBranchId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email,
          passwordHash: await hashPassword(dto.password),
          phone: dto.phone ?? null,
          status: UserStatus.ACTIVE,
          mustChangePassword: false,
          mfaEnabled: false,
        }),
      );

      await manager.getRepository(UserRole).save(
        normalizedRoleAssignments.map((assignment) =>
          manager.getRepository(UserRole).create({
            userId: user.id,
            roleId: assignment.roleId,
            branchId: assignment.branchId ?? null,
          }),
        ),
      );

      return user;
    });

    const user = await this.findByIdWithSecurityContext(createdUser.id);
    if (!user) {
      throw new NotFoundException('User not found after creation');
    }
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'users',
      action: 'create',
      entityType: 'user',
      entityId: String(createdUser.id),
      afterData: this.serializeManagedUser(user),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeManagedUser(user) };
  }

  async update(currentUser: CurrentUserContext, id: number, dto: UpdateUserDto, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    const existing = await this.findByIdWithSecurityContext(id);
    this.assertUserWithinScope(currentUser, existing, 'User not found');

    const before = this.serializeManagedUser(existing);
    const normalizedRoleAssignments = dto.roleAssignments
      ? this.normalizeAssignmentsForScope(currentUser, dto.roleAssignments)
      : undefined;
    const normalizedDefaultBranchId = this.normalizeDefaultBranchId(
      currentUser,
      dto.defaultBranchId,
      existing.defaultBranchId,
    );

    if (normalizedRoleAssignments) {
      await this.validateAssignments(currentUser.companyId, normalizedDefaultBranchId, normalizedRoleAssignments);
    } else if (dto.defaultBranchId !== undefined) {
      await this.validateDefaultBranch(currentUser.companyId, normalizedDefaultBranchId);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(User).update(
        { id },
        {
          ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
          ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
          ...(dto.email !== undefined ? { email: dto.email.toLowerCase() } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
          ...(dto.defaultBranchId !== undefined ? { defaultBranchId: normalizedDefaultBranchId } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
      );

      if (normalizedRoleAssignments) {
        await manager.getRepository(UserRole).delete({ userId: id });
        await manager.getRepository(UserRole).save(
          normalizedRoleAssignments.map((assignment) =>
            manager.getRepository(UserRole).create({
              userId: id,
              roleId: assignment.roleId,
              branchId: assignment.branchId ?? null,
            }),
          ),
        );
      }
    });

    const after = await this.findByIdWithSecurityContext(id);
    if (!after) {
      throw new NotFoundException('User not found after update');
    }
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'users',
      action: 'edit',
      entityType: 'user',
      entityId: String(id),
      beforeData: before,
      afterData: this.serializeManagedUser(after),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeManagedUser(after) };
  }

  async activate(currentUser: CurrentUserContext, id: number, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    return this.updateStatus(currentUser, id, UserStatus.ACTIVE, 'activate', requestMeta);
  }

  async deactivate(currentUser: CurrentUserContext, id: number, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    return this.updateStatus(currentUser, id, UserStatus.INACTIVE, 'deactivate', requestMeta);
  }

  async resetPassword(currentUser: CurrentUserContext, id: number, dto: ResetUserPasswordDto, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    const existing = await this.findByIdWithSecurityContext(id);
    this.assertUserWithinScope(currentUser, existing, 'User not found');

    const generatedPassword = dto.newPassword || generateTemporaryPassword();
    await this.updatePassword(id, await hashPassword(generatedPassword), true);
    const updated = await this.findByIdWithSecurityContext(id);
    if (!updated) {
      throw new NotFoundException('User not found after password reset');
    }

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'users',
      action: 'reset_password',
      entityType: 'user',
      entityId: String(id),
      meta: { forcedPasswordReset: true },
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return {
      success: true,
      temporaryPassword: generatedPassword,
      data: this.serializeManagedUser(updated),
    };
  }

  async findByEmailWithSecurityContext(email: string) {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: {
        defaultBranch: true,
        userRoles: {
          branch: true,
          role: {
            rolePermissions: {
              permission: true,
            },
          },
        },
      },
    });
  }

  async findByIdWithSecurityContext(id: number) {
    return this.userRepository.findOne({
      where: { id },
      relations: {
        defaultBranch: true,
        userRoles: {
          branch: true,
          role: {
            rolePermissions: {
              permission: true,
            },
          },
        },
      },
    });
  }

  async getCurrentUserContext(userId: number, requestedBranchId?: number | null): Promise<CurrentUserContext> {
    const user = await this.findByIdWithSecurityContext(userId);
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const branchIds = Array.from(
      new Set(user.userRoles.map((assignment) => assignment.branchId).filter((value): value is number => value !== null)),
    );
    const hasCompanyWideAccess = user.userRoles.some((assignment) => assignment.branchId === null);
    if (requestedBranchId !== undefined && requestedBranchId !== null && !hasCompanyWideAccess && !branchIds.includes(requestedBranchId)) {
      throw new ForbiddenException('Requested branch is outside the user scope');
    }

    if (requestedBranchId === null && !hasCompanyWideAccess) {
      throw new ForbiddenException('Branch-scoped users require an active branch');
    }

    const activeBranchId =
      requestedBranchId === undefined
        ? user.defaultBranchId ?? branchIds[0] ?? null
        : requestedBranchId;

    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((assignment) =>
          assignment.role.rolePermissions.map(
            (rolePermission) => `${rolePermission.permission.moduleKey}.${rolePermission.permission.actionKey}`,
          ),
        ),
      ),
    ).sort();

    const roles = Array.from(new Set(user.userRoles.map((assignment) => assignment.role.name))).sort();

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
      activeCompanyId: user.companyId,
      defaultBranchId: user.defaultBranchId,
      activeBranchId,
      branchIds,
      hasCompanyWideAccess,
      permissions,
      roles,
    };
  }

  touchLastLogin(id: number) {
    return this.userRepository.update({ id }, { lastLoginAt: new Date() });
  }

  updatePassword(id: number, passwordHash: string, mustChangePassword: boolean) {
    return this.userRepository.update({ id }, { passwordHash, mustChangePassword });
  }

  serializeCurrentUser(user: CurrentUserContext) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
      activeBranchId: user.activeBranchId,
      defaultBranchId: user.defaultBranchId,
      branchIds: user.branchIds,
      roles: user.roles,
      permissions: user.permissions,
      hasCompanyWideAccess: user.hasCompanyWideAccess,
    };
  }

  serializeManagedUser(user: User) {
    const branchIds = Array.from(
      new Set(user.userRoles.map((assignment) => assignment.branchId).filter((value): value is number => value !== null)),
    );
    const hasCompanyWideAccess = user.userRoles.some((assignment) => assignment.branchId === null);
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((assignment) =>
          assignment.role.rolePermissions.map(
            (rolePermission) => `${rolePermission.permission.moduleKey}.${rolePermission.permission.actionKey}`,
          ),
        ),
      ),
    ).sort();
    const roles = Array.from(new Set(user.userRoles.map((assignment) => assignment.role.name))).sort();

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
      activeBranchId: user.defaultBranchId ?? branchIds[0] ?? null,
      defaultBranchId: user.defaultBranchId,
      branchIds,
      roles,
      permissions,
      hasCompanyWideAccess,
      phone: user.phone,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      mustChangePassword: user.mustChangePassword,
      mfaEnabled: user.mfaEnabled,
      roleAssignments: user.userRoles.map((assignment) => ({
        roleId: assignment.roleId,
        roleName: assignment.role.name,
        branchId: assignment.branchId,
      })),
    };
  }

  private async updateStatus(
    currentUser: CurrentUserContext,
    id: number,
    status: UserStatus,
    action: 'activate' | 'deactivate',
    requestMeta?: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const existing = await this.findByIdWithSecurityContext(id);
    this.assertUserWithinScope(currentUser, existing, 'User not found');

    await this.userRepository.update({ id }, { status });
    const after = await this.findByIdWithSecurityContext(id);
    if (!after) {
      throw new NotFoundException('User not found after status change');
    }

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'users',
      action,
      entityType: 'user',
      entityId: String(id),
      afterData: this.serializeManagedUser(after),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeManagedUser(after) };
  }

  private async validateAssignments(companyId: number, defaultBranchId: number | null | undefined, assignments: Array<{ roleId: number; branchId?: number | null }>) {
    if (!assignments.length) {
      throw new BadRequestException('At least one role assignment is required');
    }

    await this.validateDefaultBranch(companyId, defaultBranchId);

    const roleIds = assignments.map((assignment) => assignment.roleId);
    const roles = await this.roleRepository.find({ where: { id: In(roleIds), companyId } });
    if (roles.length !== roleIds.length) {
      throw new BadRequestException('One or more roles are invalid for this company');
    }

    const branchIds = assignments
      .map((assignment) => assignment.branchId)
      .filter((value): value is number => value !== null && value !== undefined);

    if (branchIds.length) {
      const branches = await this.branchRepository.find({ where: { id: In(branchIds), companyId } });
      if (branches.length !== branchIds.length) {
        throw new BadRequestException('One or more branches are invalid for this company');
      }
    }
  }

  private async validateDefaultBranch(companyId: number, branchId: number | null | undefined) {
    if (branchId === null || branchId === undefined) {
      return;
    }

    const branch = await this.branchRepository.findOne({ where: { id: branchId, companyId } });
    if (!branch) {
      throw new BadRequestException('Default branch is invalid for this company');
    }
  }

  private assertUserWithinScope(
    currentUser: CurrentUserContext,
    user: User | null,
    message = 'User not found',
  ): asserts user is User {
    if (!user || !this.isUserWithinScope(currentUser, user)) {
      throw new NotFoundException(message);
    }
  }

  private isUserWithinScope(currentUser: CurrentUserContext, user: User) {
    if (user.companyId !== currentUser.companyId || Boolean(user.deletedAt)) {
      return false;
    }

    if (currentUser.hasCompanyWideAccess) {
      return true;
    }

    const activeBranchId = resolveActiveBranchId(currentUser);
    if (activeBranchId === null) {
      return false;
    }
    const branchIds = Array.from(
      new Set(user.userRoles.map((assignment) => assignment.branchId).filter((value): value is number => value !== null)),
    );
    const hasUserCompanyWideAccess = user.userRoles.some((assignment) => assignment.branchId === null);
    const hasActiveBranch = branchIds.includes(activeBranchId);
    const hasOtherBranches = branchIds.some((branchId) => branchId !== activeBranchId);

    return hasActiveBranch && !hasOtherBranches && !hasUserCompanyWideAccess;
  }

  private normalizeAssignmentsForScope(
    currentUser: CurrentUserContext,
    assignments: Array<{ roleId: number; branchId?: number | null }>,
  ) {
    if (currentUser.hasCompanyWideAccess) {
      return assignments;
    }

    const activeBranchId = resolveActiveBranchId(currentUser);
    return assignments.map((assignment) => {
      if (assignment.branchId === null) {
        throw new BadRequestException('Branch-scoped users cannot assign global roles');
      }

      if (assignment.branchId !== undefined && assignment.branchId !== activeBranchId) {
        throw new BadRequestException('Branch-scoped users can only assign the active branch');
      }

      return {
        ...assignment,
        branchId: activeBranchId,
      };
    });
  }

  private normalizeDefaultBranchId(
    currentUser: CurrentUserContext,
    branchId: number | null | undefined,
    fallbackBranchId: number | null | undefined,
  ) {
    if (currentUser.hasCompanyWideAccess) {
      return branchId ?? fallbackBranchId ?? null;
    }

    const activeBranchId = resolveActiveBranchId(currentUser);
    if (branchId === undefined) {
      return fallbackBranchId ?? activeBranchId;
    }

    if (branchId !== activeBranchId) {
      throw new BadRequestException('Branch-scoped users can only use the active branch as default branch');
    }

    return activeBranchId;
  }
}
