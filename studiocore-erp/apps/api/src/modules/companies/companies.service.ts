import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { Company } from '../../database/entities/company.entity';
import { RecordStatus } from '../../database/entities/enums';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  private canManageGlobalCompanies(currentUser: CurrentUserContext) {
    return currentUser.hasCompanyWideAccess
      && (currentUser.permissions.includes('companies.create') || currentUser.permissions.includes('companies.edit'));
  }

  async list(currentUser: CurrentUserContext) {
    const items = await this.companyRepository.find({
      where: this.canManageGlobalCompanies(currentUser)
        ? { deletedAt: IsNull() }
        : { id: currentUser.companyId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    return { items, total: items.length, page: 1, pageSize: items.length || 1 };
  }

  async create(currentUser: CurrentUserContext, dto: CreateCompanyDto, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    const company = await this.companyRepository.save(
      this.companyRepository.create({
        name: dto.name,
        legalName: dto.legalName,
        taxId: dto.taxId ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        status: RecordStatus.ACTIVE,
      }),
    );

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'companies',
      action: 'create',
      entityType: 'company',
      entityId: String(company.id),
      afterData: company as unknown as Record<string, unknown>,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: company };
  }

  async findOne(currentUser: CurrentUserContext, id: number) {
    const company = await this.companyRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!company || (!this.canManageGlobalCompanies(currentUser) && company.id !== currentUser.companyId)) {
      throw new NotFoundException('Company not found');
    }
    return { data: company };
  }

  async update(currentUser: CurrentUserContext, id: number, dto: UpdateCompanyDto, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    const existing = await this.companyRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!existing || (!this.canManageGlobalCompanies(currentUser) && existing.id !== currentUser.companyId)) {
      throw new NotFoundException('Company not found');
    }

    const before = { ...existing };
    await this.companyRepository.update(
      { id },
      {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.legalName !== undefined ? { legalName: dto.legalName } : {}),
        ...(dto.taxId !== undefined ? { taxId: dto.taxId } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      },
    );
    const company = await this.companyRepository.findOneByOrFail({ id });

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'companies',
      action: 'edit',
      entityType: 'company',
      entityId: String(id),
      beforeData: before as unknown as Record<string, unknown>,
      afterData: company as unknown as Record<string, unknown>,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: company };
  }
}
