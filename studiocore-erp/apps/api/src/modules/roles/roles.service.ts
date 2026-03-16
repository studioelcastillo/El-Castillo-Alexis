import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { Permission } from '../../database/entities/permission.entity';
import { RolePermission } from '../../database/entities/role-permission.entity';
import { Role } from '../../database/entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { ReplaceRolePermissionsDto } from './dto/replace-role-permissions.dto';
import { RolesQueryDto } from './dto/roles-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async list(currentUser: CurrentUserContext, query: RolesQueryDto) {
    const qb = this.roleRepository.createQueryBuilder('role');
    qb.leftJoinAndSelect('role.rolePermissions', 'rolePermissions')
      .leftJoinAndSelect('rolePermissions.permission', 'permission')
      .where('role.company_id = :companyId', { companyId: currentUser.companyId });

    if (query.search) {
      qb.andWhere('(role.name ILIKE :search OR role.description ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('role.created_at', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((role) => this.serializeRole(role)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async create(currentUser: CurrentUserContext, dto: CreateRoleDto, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    await this.validatePermissionIds(dto.permissionIds || []);

    const role = await this.dataSource.transaction(async (manager) => {
      const createdRole = await manager.getRepository(Role).save(
        manager.getRepository(Role).create({
          companyId: currentUser.companyId,
          name: dto.name,
          description: dto.description ?? null,
          isSystem: dto.isSystem ?? false,
        }),
      );

      if (dto.permissionIds?.length) {
        await manager.getRepository(RolePermission).save(
          dto.permissionIds.map((permissionId) =>
            manager.getRepository(RolePermission).create({
              roleId: createdRole.id,
              permissionId,
            }),
          ),
        );
      }

      return createdRole;
    });

    const hydrated = await this.findRoleOrFail(currentUser.companyId, role.id);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'roles',
      action: 'create',
      entityType: 'role',
      entityId: String(role.id),
      afterData: this.serializeRole(hydrated),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeRole(hydrated) };
  }

  async findOne(currentUser: CurrentUserContext, id: number) {
    const role = await this.findRoleOrFail(currentUser.companyId, id);
    return { data: this.serializeRole(role) };
  }

  async update(currentUser: CurrentUserContext, id: number, dto: UpdateRoleDto, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    const existing = await this.findRoleOrFail(currentUser.companyId, id);
    await this.validatePermissionIds(dto.permissionIds || []);

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Role).update(
        { id },
        {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.isSystem !== undefined ? { isSystem: dto.isSystem } : {}),
        },
      );

      if (dto.permissionIds) {
        await manager.getRepository(RolePermission).delete({ roleId: id });
        if (dto.permissionIds.length) {
          await manager.getRepository(RolePermission).save(
            dto.permissionIds.map((permissionId) =>
              manager.getRepository(RolePermission).create({ roleId: id, permissionId }),
            ),
          );
        }
      }
    });

    const after = await this.findRoleOrFail(currentUser.companyId, id);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'roles',
      action: 'edit',
      entityType: 'role',
      entityId: String(id),
      beforeData: this.serializeRole(existing),
      afterData: this.serializeRole(after),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeRole(after) };
  }

  async replacePermissions(currentUser: CurrentUserContext, id: number, dto: ReplaceRolePermissionsDto, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    await this.validatePermissionIds(dto.permissionIds);
    const existing = await this.findRoleOrFail(currentUser.companyId, id);

    await this.rolePermissionRepository.delete({ roleId: id });
    if (dto.permissionIds.length) {
      await this.rolePermissionRepository.save(
        dto.permissionIds.map((permissionId) =>
          this.rolePermissionRepository.create({ roleId: id, permissionId }),
        ),
      );
    }

    const after = await this.findRoleOrFail(currentUser.companyId, id);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'roles',
      action: 'manage_permissions',
      entityType: 'role',
      entityId: String(id),
      beforeData: this.serializeRole(existing),
      afterData: this.serializeRole(after),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeRole(after) };
  }

  private async findRoleOrFail(companyId: number, id: number) {
    const role = await this.roleRepository.findOne({
      where: { id, companyId },
      relations: { rolePermissions: { permission: true } },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  private async validatePermissionIds(permissionIds: number[]) {
    if (!permissionIds.length) {
      return;
    }

    const permissions = await this.permissionRepository.find({ where: { id: In(permissionIds) } });
    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('One or more permissions are invalid');
    }
  }

  private serializeRole(role: Role) {
    return {
      id: role.id,
      companyId: role.companyId,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissionIds: role.rolePermissions?.map((item) => item.permissionId).sort((a, b) => a - b) || [],
      permissions:
        role.rolePermissions?.map((item) => ({
          id: item.permission.id,
          key: `${item.permission.moduleKey}.${item.permission.actionKey}`,
        })) || [],
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
