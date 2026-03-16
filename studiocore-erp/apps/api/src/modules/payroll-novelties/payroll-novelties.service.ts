import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { assertBranchAccess, resolveBranchFilter } from '../../common/utils/tenant-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PayrollNoveltyStatus, PayrollNoveltyType } from '../../database/entities/enums';
import { PayrollNovelty } from '../../database/entities/payroll-novelty.entity';
import { PayrollPeriod } from '../../database/entities/payroll-period.entity';
import { Person } from '../../database/entities/person.entity';
import { CreatePayrollNoveltyDto } from './dto/create-payroll-novelty.dto';
import { PayrollNoveltiesQueryDto } from './dto/payroll-novelties-query.dto';
import { UpdatePayrollNoveltyDto } from './dto/update-payroll-novelty.dto';

type RequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class PayrollNoveltiesService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(PayrollNovelty)
    private readonly noveltyRepository: Repository<PayrollNovelty>,
    @InjectRepository(PayrollPeriod)
    private readonly payrollPeriodRepository: Repository<PayrollPeriod>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  async list(currentUser: CurrentUserContext, query: PayrollNoveltiesQueryDto) {
    const qb = this.noveltyRepository.createQueryBuilder('novelty');
    qb.leftJoinAndSelect('novelty.person', 'person')
      .leftJoinAndSelect('novelty.branch', 'branch')
      .leftJoinAndSelect('novelty.period', 'period')
      .where('novelty.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('novelty.deleted_at IS NULL');

    const branchId = resolveBranchFilter(currentUser, query.branchId);
    if (branchId !== null) {
      qb.andWhere('novelty.branch_id = :branchId', { branchId });
    }

    if (query.periodId) {
      qb.andWhere('novelty.period_id = :periodId', { periodId: query.periodId });
    }

    if (query.personId) {
      qb.andWhere('novelty.person_id = :personId', { personId: query.personId });
    }

    if (query.status) {
      qb.andWhere('novelty.status = :status', { status: query.status });
    }

    if (query.noveltyType) {
      qb.andWhere('novelty.novelty_type = :noveltyType', { noveltyType: query.noveltyType });
    }

    if (query.from) {
      qb.andWhere('novelty.effective_date >= :from', { from: query.from });
    }

    if (query.to) {
      qb.andWhere('novelty.effective_date <= :to', { to: query.to });
    }

    if (query.search) {
      qb.andWhere(
        '(novelty.title ILIKE :search OR novelty.notes ILIKE :search OR person.first_name ILIKE :search OR person.last_name ILIKE :search OR period.label ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('novelty.effectiveDate', 'DESC').addOrderBy('novelty.createdAt', 'DESC').skip((query.page - 1) * query.pageSize).take(query.pageSize);
    const [items, total] = await qb.getManyAndCount();
    return { items: items.map((item) => this.serializeNovelty(item)), total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(currentUser: CurrentUserContext, id: number) {
    const novelty = await this.findNoveltyOrFail(currentUser, id);
    return { data: this.serializeNovelty(novelty) };
  }

  async create(currentUser: CurrentUserContext, dto: CreatePayrollNoveltyDto, requestMeta?: RequestMeta) {
    const period = await this.ensureEditablePeriod(currentUser, dto.periodId);
    const person = await this.ensurePerson(currentUser.companyId, period.branchId, dto.personId);
    const novelty = await this.noveltyRepository.save(
      this.noveltyRepository.create({
        periodId: period.id,
        companyId: currentUser.companyId,
        branchId: period.branchId,
        personId: person.id,
        noveltyType: this.parseNoveltyType(dto.noveltyType),
        title: dto.title.trim(),
        amount: this.normalizeRequiredNumericString(dto.amount, 'Payroll novelty amount is required'),
        effectiveDate: dto.effectiveDate,
        status: this.parseNoveltyStatus(dto.status),
        isCritical: Boolean(dto.isCritical),
        notes: this.normalizeString(dto.notes),
      }),
    );

    const created = await this.noveltyRepository.findOneOrFail({ where: { id: novelty.id }, relations: { person: true, branch: true, period: true } });
    const data = this.serializeNovelty(created);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? period.branchId,
      userId: currentUser.id,
      module: 'payroll_novelties',
      action: 'create',
      entityType: 'payroll_novelty',
      entityId: String(created.id),
      afterData: data,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data };
  }

  async update(currentUser: CurrentUserContext, id: number, dto: UpdatePayrollNoveltyDto, requestMeta?: RequestMeta) {
    const existing = await this.findNoveltyOrFail(currentUser, id);
    const period = dto.periodId !== undefined
      ? await this.ensureEditablePeriod(currentUser, dto.periodId)
      : await this.ensureEditablePeriod(currentUser, existing.periodId);
    const nextPersonId = dto.personId ?? existing.personId;
    await this.ensurePerson(currentUser.companyId, period.branchId, nextPersonId);
    const before = this.serializeNovelty(existing);

    await this.noveltyRepository.update(
      { id },
      {
        ...(dto.periodId !== undefined ? { periodId: period.id, branchId: period.branchId } : {}),
        ...(dto.personId !== undefined ? { personId: dto.personId } : {}),
        ...(dto.noveltyType !== undefined ? { noveltyType: this.parseNoveltyType(dto.noveltyType) } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.amount !== undefined ? { amount: this.normalizeRequiredNumericString(dto.amount, 'Payroll novelty amount is required') } : {}),
        ...(dto.effectiveDate !== undefined ? { effectiveDate: dto.effectiveDate } : {}),
        ...(dto.status !== undefined ? { status: this.parseNoveltyStatus(dto.status) } : {}),
        ...(dto.isCritical !== undefined ? { isCritical: dto.isCritical } : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeString(dto.notes) } : {}),
      },
    );

    const novelty = await this.findNoveltyOrFail(currentUser, id);
    const data = this.serializeNovelty(novelty);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? novelty.branchId,
      userId: currentUser.id,
      module: 'payroll_novelties',
      action: 'edit',
      entityType: 'payroll_novelty',
      entityId: String(id),
      beforeData: before,
      afterData: data,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data };
  }

  private async findNoveltyOrFail(currentUser: CurrentUserContext, id: number) {
    const novelty = await this.noveltyRepository.findOne({
      where: { id, companyId: currentUser.companyId, deletedAt: IsNull() },
      relations: { person: true, branch: true, period: true },
    });
    if (!novelty) {
      throw new NotFoundException('Payroll novelty not found');
    }

    assertBranchAccess(currentUser, novelty.branchId, 'Payroll novelty not found');
    return novelty;
  }

  private async ensureEditablePeriod(currentUser: CurrentUserContext, periodId: number) {
    const period = await this.payrollPeriodRepository.findOne({
      where: { id: periodId, companyId: currentUser.companyId, deletedAt: IsNull() },
      relations: { branch: true },
    });
    if (!period) {
      throw new BadRequestException('Payroll period is invalid');
    }

    assertBranchAccess(currentUser, period.branchId, 'Payroll period is invalid');
    if (period.status === 'closed') {
      throw new BadRequestException('Closed payroll periods must be reopened before editing novelties');
    }
    return period;
  }

  private async ensurePerson(companyId: number, branchId: number, personId: number) {
    const person = await this.personRepository.findOne({ where: { id: personId, companyId, deletedAt: IsNull() } });
    if (!person) {
      throw new BadRequestException('Person is invalid');
    }
    if (person.branchId !== null && person.branchId !== branchId) {
      throw new BadRequestException('Person does not belong to the payroll period branch');
    }
    return person;
  }

  private serializeNovelty(novelty: PayrollNovelty) {
    return {
      id: novelty.id,
      periodId: novelty.periodId,
      companyId: novelty.companyId,
      branchId: novelty.branchId,
      personId: novelty.personId,
      noveltyType: novelty.noveltyType,
      title: novelty.title,
      amount: this.formatNumeric(this.parseNumeric(novelty.amount)),
      signedAmount: this.formatNumeric(this.resolveSignedAmount(novelty.noveltyType, novelty.amount)),
      effectiveDate: novelty.effectiveDate,
      status: novelty.status,
      isCritical: novelty.isCritical,
      notes: novelty.notes,
      personName: `${novelty.person.firstName} ${novelty.person.lastName}`.trim(),
      personType: novelty.person.personType,
      branchName: novelty.branch ? `${novelty.branch.name} (${novelty.branch.code})` : null,
      periodLabel: novelty.period?.label ?? null,
      createdAt: novelty.createdAt.toISOString(),
      updatedAt: novelty.updatedAt.toISOString(),
      deletedAt: novelty.deletedAt ? novelty.deletedAt.toISOString() : null,
    };
  }

  private parseNoveltyType(value: string) {
    if (!Object.values(PayrollNoveltyType).includes(value as PayrollNoveltyType)) {
      throw new BadRequestException('Payroll novelty type is invalid');
    }
    return value as PayrollNoveltyType;
  }

  private parseNoveltyStatus(value?: string) {
    if (!value) {
      return PayrollNoveltyStatus.PENDING;
    }
    if (!Object.values(PayrollNoveltyStatus).includes(value as PayrollNoveltyStatus)) {
      throw new BadRequestException('Payroll novelty status is invalid');
    }
    return value as PayrollNoveltyStatus;
  }

  private resolveSignedAmount(type: PayrollNoveltyType, value: string | number | null | undefined) {
    const numeric = this.parseNumeric(value);
    if (type === PayrollNoveltyType.DEDUCTION) {
      return -Math.abs(numeric);
    }
    return Math.abs(numeric);
  }

  private parseNumeric(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private formatNumeric(value: number) {
    const normalized = Number.isInteger(value) ? String(value) : value.toFixed(2);
    return normalized.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
  }

  private normalizeRequiredNumericString(value: string | null | undefined, message: string) {
    const normalized = this.normalizeString(value);
    if (!normalized) {
      throw new BadRequestException(message);
    }
    if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
      throw new BadRequestException('Numeric value is invalid');
    }
    return normalized;
  }

  private normalizeString(value: string | null | undefined) {
    const normalized = (value || '').trim();
    return normalized || null;
  }
}
