import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { resolveBranchFilter } from '../../common/utils/tenant-scope';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

type AuditRecordInput = {
  companyId?: number | null;
  branchId?: number | null;
  userId?: number | null;
  module: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  record(input: AuditRecordInput) {
    return this.auditLogRepository.save(
      this.auditLogRepository.create({
        companyId: input.companyId ?? null,
        branchId: input.branchId ?? null,
        userId: input.userId ?? null,
        module: input.module,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        beforeData: input.beforeData ?? null,
        afterData: input.afterData ?? null,
        meta: input.meta ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      }),
    );
  }

  async list(currentUser: CurrentUserContext, query: AuditLogQueryDto) {
    const qb = this.auditLogRepository.createQueryBuilder('audit');
    qb.where('audit.company_id = :companyId', { companyId: currentUser.companyId });

    const branchId = resolveBranchFilter(currentUser, query.branchId);
    if (branchId !== null) {
      qb.andWhere('audit.branch_id = :branchId', { branchId });
    }

    if (query.userId) {
      qb.andWhere('audit.user_id = :userId', { userId: query.userId });
    }

    if (query.module) {
      qb.andWhere('audit.module = :module', { module: query.module });
    }

    if (query.action) {
      qb.andWhere('audit.action = :action', { action: query.action });
    }

    if (query.entityType) {
      qb.andWhere('audit.entity_type = :entityType', { entityType: query.entityType });
    }

    if (query.search) {
      qb.andWhere('(audit.entity_id ILIKE :search OR audit.module ILIKE :search OR audit.action ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.from) {
      qb.andWhere('audit.created_at >= :from', { from: query.from });
    }

    if (query.to) {
      qb.andWhere('audit.created_at <= :to', { to: query.to });
    }

    qb.orderBy('audit.created_at', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
}
