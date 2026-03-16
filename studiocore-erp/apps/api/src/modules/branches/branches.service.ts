import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import {
  applyBranchScope,
  assertBranchAccess,
} from '../../common/utils/tenant-scope';
import { Branch } from '../../database/entities/branch.entity';
import { RecordStatus } from '../../database/entities/enums';
import { BranchesQueryDto } from './dto/branches-query.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async list(currentUser: CurrentUserContext, query: BranchesQueryDto) {
    const qb = this.branchRepository.createQueryBuilder('branch');
    qb.where('branch.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('branch.deleted_at IS NULL');
    applyBranchScope(qb, currentUser, 'branch.id');

    if (query.status) {
      qb.andWhere('branch.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere('(branch.name ILIKE :search OR branch.code ILIKE :search OR branch.city ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('branch.created_at', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async create(currentUser: CurrentUserContext, dto: CreateBranchDto, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    const branch = await this.branchRepository.save(
      this.branchRepository.create({
        companyId: currentUser.companyId,
        name: dto.name,
        code: dto.code,
        city: dto.city ?? null,
        address: dto.address ?? null,
        phone: dto.phone ?? null,
        status: RecordStatus.ACTIVE,
      }),
    );

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'branches',
      action: 'create',
      entityType: 'branch',
      entityId: String(branch.id),
      afterData: branch as unknown as Record<string, unknown>,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: branch };
  }

  async findOne(currentUser: CurrentUserContext, id: number) {
    const branch = await this.branchRepository.findOne({ where: { id, companyId: currentUser.companyId, deletedAt: IsNull() } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    assertBranchAccess(currentUser, branch.id, 'Branch not found');
    return { data: branch };
  }

  async update(currentUser: CurrentUserContext, id: number, dto: UpdateBranchDto, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    const existing = await this.branchRepository.findOne({ where: { id, companyId: currentUser.companyId, deletedAt: IsNull() } });
    if (!existing) {
      throw new NotFoundException('Branch not found');
    }

    const before = { ...existing };
    await this.branchRepository.update(
      { id },
      {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      },
    );
    const branch = await this.branchRepository.findOneByOrFail({ id });

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'branches',
      action: 'edit',
      entityType: 'branch',
      entityId: String(id),
      beforeData: before as unknown as Record<string, unknown>,
      afterData: branch as unknown as Record<string, unknown>,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: branch };
  }
}
