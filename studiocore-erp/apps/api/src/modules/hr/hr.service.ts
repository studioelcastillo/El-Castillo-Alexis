import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, SelectQueryBuilder } from 'typeorm';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { assertBranchAccess, resolveBranchFilter, resolveWritableBranchId } from '../../common/utils/tenant-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Branch } from '../../database/entities/branch.entity';
import { HrDisciplinaryActionType, HrRequestStatus, PersonType, PayrollNoveltyStatus, PayrollNoveltyType, PayrollPeriodStatus } from '../../database/entities/enums';
import { HrDisciplinaryAction } from '../../database/entities/hr-disciplinary-action.entity';
import { HrIncapacity } from '../../database/entities/hr-incapacity.entity';
import { HrVacation } from '../../database/entities/hr-vacation.entity';
import { PayrollNovelty } from '../../database/entities/payroll-novelty.entity';
import { PayrollPeriod } from '../../database/entities/payroll-period.entity';
import { Person } from '../../database/entities/person.entity';
import { CreateHrDisciplinaryActionDto } from './dto/create-hr-disciplinary-action.dto';
import { CreateHrIncapacityDto } from './dto/create-hr-incapacity.dto';
import { CreateHrVacationDto } from './dto/create-hr-vacation.dto';
import { HrRequestsQueryDto } from './dto/hr-requests-query.dto';
import { UpdateHrDisciplinaryActionDto } from './dto/update-hr-disciplinary-action.dto';
import { UpdateHrIncapacityDto } from './dto/update-hr-incapacity.dto';
import { UpdateHrVacationDto } from './dto/update-hr-vacation.dto';

type RequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class HrService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(HrDisciplinaryAction)
    private readonly disciplinaryActionRepository: Repository<HrDisciplinaryAction>,
    @InjectRepository(HrIncapacity)
    private readonly incapacityRepository: Repository<HrIncapacity>,
    @InjectRepository(HrVacation)
    private readonly vacationRepository: Repository<HrVacation>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(PayrollPeriod)
    private readonly payrollPeriodRepository: Repository<PayrollPeriod>,
    @InjectRepository(PayrollNovelty)
    private readonly payrollNoveltyRepository: Repository<PayrollNovelty>,
  ) {}

  async listIncapacities(currentUser: CurrentUserContext, query: HrRequestsQueryDto) {
    const qb = this.incapacityRepository.createQueryBuilder('record');
    qb.leftJoinAndSelect('record.person', 'person')
      .leftJoinAndSelect('record.branch', 'branch')
      .leftJoinAndSelect('record.payrollNovelty', 'payrollNovelty')
      .leftJoinAndSelect('payrollNovelty.period', 'payrollPeriod')
      .where('record.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('record.deleted_at IS NULL');

    this.applyHrFilters(qb, currentUser, query, 'record');
    qb.orderBy('record.startsAt', 'DESC').skip((query.page - 1) * query.pageSize).take(query.pageSize);
    const [items, total] = await qb.getManyAndCount();
    return { items: items.map((item) => this.serializeIncapacity(item)), total, page: query.page, pageSize: query.pageSize };
  }

  async listVacations(currentUser: CurrentUserContext, query: HrRequestsQueryDto) {
    const qb = this.vacationRepository.createQueryBuilder('record');
    qb.leftJoinAndSelect('record.person', 'person')
      .leftJoinAndSelect('record.branch', 'branch')
      .leftJoinAndSelect('record.payrollNovelty', 'payrollNovelty')
      .leftJoinAndSelect('payrollNovelty.period', 'payrollPeriod')
      .where('record.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('record.deleted_at IS NULL');

    this.applyHrFilters(qb, currentUser, query, 'record');
    qb.orderBy('record.startsAt', 'DESC').skip((query.page - 1) * query.pageSize).take(query.pageSize);
    const [items, total] = await qb.getManyAndCount();
    return { items: items.map((item) => this.serializeVacation(item)), total, page: query.page, pageSize: query.pageSize };
  }

  async listDisciplinaryActions(currentUser: CurrentUserContext, query: HrRequestsQueryDto) {
    const qb = this.disciplinaryActionRepository.createQueryBuilder('record');
    qb.leftJoinAndSelect('record.person', 'person')
      .leftJoinAndSelect('record.branch', 'branch')
      .leftJoinAndSelect('record.payrollNovelty', 'payrollNovelty')
      .leftJoinAndSelect('payrollNovelty.period', 'payrollPeriod')
      .where('record.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('record.deleted_at IS NULL');

    this.applyDisciplineFilters(qb, currentUser, query, 'record');
    qb.orderBy('record.effectiveDate', 'DESC').skip((query.page - 1) * query.pageSize).take(query.pageSize);
    const [items, total] = await qb.getManyAndCount();
    return { items: items.map((item) => this.serializeDisciplinaryAction(item)), total, page: query.page, pageSize: query.pageSize };
  }

  async findIncapacity(currentUser: CurrentUserContext, id: number) {
    const record = await this.findIncapacityOrFail(currentUser, id);
    return { data: this.serializeIncapacity(record) };
  }

  async findVacation(currentUser: CurrentUserContext, id: number) {
    const record = await this.findVacationOrFail(currentUser, id);
    return { data: this.serializeVacation(record) };
  }

  async findDisciplinaryAction(currentUser: CurrentUserContext, id: number) {
    const record = await this.findDisciplinaryActionOrFail(currentUser, id);
    return { data: this.serializeDisciplinaryAction(record) };
  }

  async createIncapacity(currentUser: CurrentUserContext, dto: CreateHrIncapacityDto, requestMeta?: RequestMeta) {
    const branchId = this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId), 'incapacities');
    const branch = await this.ensureBranch(currentUser.companyId, branchId);
    const person = await this.ensurePerson(currentUser.companyId, branchId, dto.personId);
    this.assertDateRange(dto.startsAt, dto.endsAt, 'Incapacity end must be greater than or equal to start');

    const saved = await this.incapacityRepository.save(
      this.incapacityRepository.create({
        companyId: currentUser.companyId,
        branchId,
        personId: person.id,
        reason: dto.reason.trim(),
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
        supportUrl: this.normalizeString(dto.supportUrl),
        status: this.parseHrRequestStatus(dto.status),
        notes: this.normalizeString(dto.notes),
      }),
    );

    const synced = await this.syncIncapacityNovelty(saved.id);
    const data = this.serializeIncapacity(synced);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'hr',
      action: 'create_incapacity',
      entityType: 'hr_incapacity',
      entityId: String(saved.id),
      afterData: data,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data };
  }

  async updateIncapacity(currentUser: CurrentUserContext, id: number, dto: UpdateHrIncapacityDto, requestMeta?: RequestMeta) {
    const existing = await this.findIncapacityOrFail(currentUser, id);
    const nextBranchId = dto.branchId !== undefined ? this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId), 'incapacities') : existing.branchId;
    const branch = await this.ensureBranch(currentUser.companyId, nextBranchId);
    const nextPersonId = dto.personId ?? existing.personId;
    await this.ensurePerson(currentUser.companyId, nextBranchId, nextPersonId);
    const nextStart = dto.startsAt ?? existing.startsAt;
    const nextEnd = dto.endsAt ?? existing.endsAt;
    this.assertDateRange(nextStart, nextEnd, 'Incapacity end must be greater than or equal to start');
    const before = this.serializeIncapacity(existing);

    await this.incapacityRepository.update(
      { id },
      {
        ...(dto.branchId !== undefined ? { branchId: nextBranchId } : {}),
        ...(dto.personId !== undefined ? { personId: dto.personId } : {}),
        ...(dto.reason !== undefined ? { reason: dto.reason.trim() } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: dto.startsAt } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: dto.endsAt } : {}),
        ...(dto.supportUrl !== undefined ? { supportUrl: this.normalizeString(dto.supportUrl) } : {}),
        ...(dto.status !== undefined ? { status: this.parseHrRequestStatus(dto.status) } : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeString(dto.notes) } : {}),
      },
    );

    const synced = await this.syncIncapacityNovelty(id);
    const data = this.serializeIncapacity(synced);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'hr',
      action: 'edit_incapacity',
      entityType: 'hr_incapacity',
      entityId: String(id),
      beforeData: before,
      afterData: data,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data };
  }

  async createVacation(currentUser: CurrentUserContext, dto: CreateHrVacationDto, requestMeta?: RequestMeta) {
    const branchId = this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId), 'vacations');
    const branch = await this.ensureBranch(currentUser.companyId, branchId);
    const person = await this.ensurePerson(currentUser.companyId, branchId, dto.personId);
    this.assertDateRange(dto.startsAt, dto.endsAt, 'Vacation end must be greater than or equal to start');

    const saved = await this.vacationRepository.save(
      this.vacationRepository.create({
        companyId: currentUser.companyId,
        branchId,
        personId: person.id,
        reason: dto.reason.trim(),
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
        isPaid: dto.isPaid ?? true,
        status: this.parseHrRequestStatus(dto.status),
        notes: this.normalizeString(dto.notes),
      }),
    );

    const synced = await this.syncVacationNovelty(saved.id);
    const data = this.serializeVacation(synced);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'hr',
      action: 'create_vacation',
      entityType: 'hr_vacation',
      entityId: String(saved.id),
      afterData: data,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data };
  }

  async updateVacation(currentUser: CurrentUserContext, id: number, dto: UpdateHrVacationDto, requestMeta?: RequestMeta) {
    const existing = await this.findVacationOrFail(currentUser, id);
    const nextBranchId = dto.branchId !== undefined ? this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId), 'vacations') : existing.branchId;
    const branch = await this.ensureBranch(currentUser.companyId, nextBranchId);
    const nextPersonId = dto.personId ?? existing.personId;
    await this.ensurePerson(currentUser.companyId, nextBranchId, nextPersonId);
    const nextStart = dto.startsAt ?? existing.startsAt;
    const nextEnd = dto.endsAt ?? existing.endsAt;
    this.assertDateRange(nextStart, nextEnd, 'Vacation end must be greater than or equal to start');
    const before = this.serializeVacation(existing);

    await this.vacationRepository.update(
      { id },
      {
        ...(dto.branchId !== undefined ? { branchId: nextBranchId } : {}),
        ...(dto.personId !== undefined ? { personId: dto.personId } : {}),
        ...(dto.reason !== undefined ? { reason: dto.reason.trim() } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: dto.startsAt } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: dto.endsAt } : {}),
        ...(dto.isPaid !== undefined ? { isPaid: dto.isPaid } : {}),
        ...(dto.status !== undefined ? { status: this.parseHrRequestStatus(dto.status) } : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeString(dto.notes) } : {}),
      },
    );

    const synced = await this.syncVacationNovelty(id);
    const data = this.serializeVacation(synced);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'hr',
      action: 'edit_vacation',
      entityType: 'hr_vacation',
      entityId: String(id),
      beforeData: before,
      afterData: data,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data };
  }

  async createDisciplinaryAction(currentUser: CurrentUserContext, dto: CreateHrDisciplinaryActionDto, requestMeta?: RequestMeta) {
    const branchId = this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId), 'disciplinary actions');
    const branch = await this.ensureBranch(currentUser.companyId, branchId);
    const person = await this.ensurePerson(currentUser.companyId, branchId, dto.personId);
    this.assertSingleDate(dto.effectiveDate, 'Disciplinary action effective date is invalid');

    const saved = await this.disciplinaryActionRepository.save(
      this.disciplinaryActionRepository.create({
        companyId: currentUser.companyId,
        branchId,
        personId: person.id,
        actionType: this.parseDisciplinaryActionType(dto.actionType),
        title: dto.title.trim(),
        effectiveDate: dto.effectiveDate,
        supportUrl: this.normalizeString(dto.supportUrl),
        payrollImpactAmount: this.normalizeNumericString(dto.payrollImpactAmount),
        status: this.parseHrRequestStatus(dto.status),
        notes: this.normalizeString(dto.notes),
      }),
    );

    await this.syncDisciplinaryNovelty(saved.id);
    const synced = await this.findDisciplinaryActionOrFail(currentUser, saved.id);
    const data = this.serializeDisciplinaryAction(synced);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'hr',
      action: 'create_disciplinary_action',
      entityType: 'hr_disciplinary_action',
      entityId: String(saved.id),
      afterData: data,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data };
  }

  async updateDisciplinaryAction(currentUser: CurrentUserContext, id: number, dto: UpdateHrDisciplinaryActionDto, requestMeta?: RequestMeta) {
    const existing = await this.findDisciplinaryActionOrFail(currentUser, id);
    const nextBranchId = dto.branchId !== undefined ? this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId), 'disciplinary actions') : existing.branchId;
    const branch = await this.ensureBranch(currentUser.companyId, nextBranchId);
    const nextPersonId = dto.personId ?? existing.personId;
    await this.ensurePerson(currentUser.companyId, nextBranchId, nextPersonId);
    const nextEffectiveDate = dto.effectiveDate ?? existing.effectiveDate;
    this.assertSingleDate(nextEffectiveDate, 'Disciplinary action effective date is invalid');
    const before = this.serializeDisciplinaryAction(existing);

    await this.disciplinaryActionRepository.update(
      { id },
      {
        ...(dto.branchId !== undefined ? { branchId: nextBranchId } : {}),
        ...(dto.personId !== undefined ? { personId: dto.personId } : {}),
        ...(dto.actionType !== undefined ? { actionType: this.parseDisciplinaryActionType(dto.actionType) } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.effectiveDate !== undefined ? { effectiveDate: dto.effectiveDate } : {}),
        ...(dto.supportUrl !== undefined ? { supportUrl: this.normalizeString(dto.supportUrl) } : {}),
        ...(dto.payrollImpactAmount !== undefined ? { payrollImpactAmount: this.normalizeNumericString(dto.payrollImpactAmount) } : {}),
        ...(dto.status !== undefined ? { status: this.parseHrRequestStatus(dto.status) } : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeString(dto.notes) } : {}),
      },
    );

    await this.syncDisciplinaryNovelty(id);
    const synced = await this.findDisciplinaryActionOrFail(currentUser, id);
    const data = this.serializeDisciplinaryAction(synced);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'hr',
      action: 'edit_disciplinary_action',
      entityType: 'hr_disciplinary_action',
      entityId: String(id),
      beforeData: before,
      afterData: data,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data };
  }

  private applyHrFilters(qb: SelectQueryBuilder<any>, currentUser: CurrentUserContext, query: HrRequestsQueryDto, alias: string) {
    const branchId = resolveBranchFilter(currentUser, query.branchId);
    if (branchId !== null) {
      qb.andWhere(`${alias}.branch_id = :branchId`, { branchId });
    }
    if (query.personId) {
      qb.andWhere(`${alias}.person_id = :personId`, { personId: query.personId });
    }
    if (query.status) {
      qb.andWhere(`${alias}.status = :status`, { status: query.status });
    }
    if (query.from) {
      qb.andWhere(`${alias}.starts_at >= :from`, { from: query.from });
    }
    if (query.to) {
      qb.andWhere(`${alias}.ends_at <= :to`, { to: query.to });
    }
    if (query.search) {
      qb.andWhere(`(${alias}.reason ILIKE :search OR ${alias}.notes ILIKE :search OR person.first_name ILIKE :search OR person.last_name ILIKE :search)`, {
        search: `%${query.search}%`,
      });
    }
  }

  private applyDisciplineFilters(qb: SelectQueryBuilder<any>, currentUser: CurrentUserContext, query: HrRequestsQueryDto, alias: string) {
    const branchId = resolveBranchFilter(currentUser, query.branchId);
    if (branchId !== null) {
      qb.andWhere(`${alias}.branch_id = :branchId`, { branchId });
    }
    if (query.personId) {
      qb.andWhere(`${alias}.person_id = :personId`, { personId: query.personId });
    }
    if (query.status) {
      qb.andWhere(`${alias}.status = :status`, { status: query.status });
    }
    if (query.from) {
      qb.andWhere(`${alias}.effective_date >= :from`, { from: query.from });
    }
    if (query.to) {
      qb.andWhere(`${alias}.effective_date <= :to`, { to: query.to });
    }
    if (query.search) {
      qb.andWhere(`(${alias}.title ILIKE :search OR ${alias}.notes ILIKE :search OR person.first_name ILIKE :search OR person.last_name ILIKE :search)`, {
        search: `%${query.search}%`,
      });
    }
  }

  private async syncIncapacityNovelty(id: number) {
    const record = await this.loadIncapacityForSync(id);
    return this.syncPayrollNovelty({
      type: 'incapacity',
      record,
      label: `Incapacidad: ${record.reason}`,
      noveltyType: PayrollNoveltyType.INCIDENT,
      amount: '0',
      isCritical: false,
      buildNotes: () => this.buildHrNotes(record.notes, record.supportUrl),
      saveNoveltyId: async (payrollNoveltyId) => {
        await this.incapacityRepository.update({ id: record.id }, { payrollNoveltyId });
        return this.loadIncapacityForSync(record.id);
      },
      clearNoveltyId: async () => {
        await this.incapacityRepository.update({ id: record.id }, { payrollNoveltyId: null });
        return this.loadIncapacityForSync(record.id);
      },
    });
  }

  private async syncVacationNovelty(id: number) {
    const record = await this.loadVacationForSync(id);
    return this.syncPayrollNovelty({
      type: 'vacation',
      record,
      label: `Vacaciones: ${record.reason}`,
      noveltyType: record.isPaid ? PayrollNoveltyType.ALLOWANCE : PayrollNoveltyType.DEDUCTION,
      amount: '0',
      isCritical: false,
      buildNotes: () => this.buildHrNotes(record.notes, null),
      saveNoveltyId: async (payrollNoveltyId) => {
        await this.vacationRepository.update({ id: record.id }, { payrollNoveltyId });
        return this.loadVacationForSync(record.id);
      },
      clearNoveltyId: async () => {
        await this.vacationRepository.update({ id: record.id }, { payrollNoveltyId: null });
        return this.loadVacationForSync(record.id);
      },
    });
  }

  private async syncDisciplinaryNovelty(id: number) {
    const record = await this.loadDisciplinaryActionForSync(id);
    const amount = this.normalizeNumericString(record.payrollImpactAmount);
    const syncRecord = {
      id: record.id,
      companyId: record.companyId,
      branchId: record.branchId,
      personId: record.personId,
      startsAt: record.effectiveDate,
      status: record.status,
      payrollNoveltyId: record.payrollNoveltyId,
    };
    return this.syncPayrollNovelty({
      type: 'disciplinary_action',
      record: syncRecord,
      label: `Disciplina: ${record.title}`,
      noveltyType: PayrollNoveltyType.DEDUCTION,
      amount: amount ?? '0',
      isCritical: amount !== null && this.parseNumeric(amount) > 0,
      buildNotes: () => this.buildHrNotes(record.notes, record.supportUrl),
      shouldSync: () => amount !== null && this.parseNumeric(amount) > 0,
      saveNoveltyId: async (payrollNoveltyId) => {
        await this.disciplinaryActionRepository.update({ id: record.id }, { payrollNoveltyId });
        return { ...syncRecord, payrollNoveltyId };
      },
      clearNoveltyId: async () => {
        await this.disciplinaryActionRepository.update({ id: record.id }, { payrollNoveltyId: null });
        return { ...syncRecord, payrollNoveltyId: null };
      },
    });
  }

  private async syncPayrollNovelty<T extends { id: number; companyId: number; branchId: number; personId: number; startsAt: string; status: HrRequestStatus; payrollNoveltyId: number | null }>(
    input: {
      type: 'incapacity' | 'vacation' | 'disciplinary_action';
      record: T;
      label: string;
      noveltyType: PayrollNoveltyType;
      amount: string;
      isCritical: boolean;
      buildNotes: () => string | null;
      shouldSync?: () => boolean;
      saveNoveltyId: (payrollNoveltyId: number | null) => Promise<T>;
      clearNoveltyId: () => Promise<T>;
    },
  ) {
    const existingNovelty = input.record.payrollNoveltyId ? await this.loadPayrollNovelty(input.record.payrollNoveltyId) : null;

    if (input.shouldSync && !input.shouldSync()) {
      if (!existingNovelty) {
        return input.record;
      }
      if (existingNovelty.period.status === PayrollPeriodStatus.CLOSED) {
        throw new BadRequestException('Linked payroll period is closed; reopen it before changing this HR record');
      }
      await this.payrollNoveltyRepository.softDelete({ id: existingNovelty.id });
      return input.clearNoveltyId();
    }

    if (input.record.status !== HrRequestStatus.APPROVED) {
      if (!existingNovelty) {
        return input.record;
      }
      if (existingNovelty.period.status === PayrollPeriodStatus.CLOSED) {
        throw new BadRequestException('Linked payroll period is closed; reopen it before changing this HR record');
      }
      await this.payrollNoveltyRepository.softDelete({ id: existingNovelty.id });
      return input.clearNoveltyId();
    }

    const targetPeriod = await this.findMatchingPayrollPeriod(input.record.companyId, input.record.branchId, input.record.startsAt);
    if (!targetPeriod) {
      if (!existingNovelty) {
        return input.record;
      }
      if (existingNovelty.period.status === PayrollPeriodStatus.CLOSED) {
        throw new BadRequestException('Linked payroll period is closed; reopen it before changing this HR record');
      }
      await this.payrollNoveltyRepository.softDelete({ id: existingNovelty.id });
      return input.clearNoveltyId();
    }

    if (targetPeriod.status === PayrollPeriodStatus.CLOSED) {
      throw new BadRequestException('Approved HR records cannot sync into a closed payroll period');
    }

    let noveltyId = existingNovelty?.id ?? null;
    if (existingNovelty && existingNovelty.periodId !== targetPeriod.id) {
      if (existingNovelty.period.status === PayrollPeriodStatus.CLOSED) {
        throw new BadRequestException('Linked payroll period is closed; reopen it before moving this HR record');
      }
      await this.payrollNoveltyRepository.softDelete({ id: existingNovelty.id });
      noveltyId = null;
    }

    const payload = {
      periodId: targetPeriod.id,
      companyId: input.record.companyId,
      branchId: input.record.branchId,
      personId: input.record.personId,
      noveltyType: input.noveltyType,
      title: input.label,
      amount: input.amount,
      effectiveDate: input.record.startsAt,
      status: PayrollNoveltyStatus.APPROVED,
      isCritical: input.isCritical,
      notes: input.buildNotes(),
    };

    if (noveltyId) {
      await this.payrollNoveltyRepository.update({ id: noveltyId }, payload);
      return input.saveNoveltyId(noveltyId);
    }

    const novelty = await this.payrollNoveltyRepository.save(this.payrollNoveltyRepository.create(payload));
    return input.saveNoveltyId(novelty.id);
  }

  private async findMatchingPayrollPeriod(companyId: number, branchId: number, effectiveDate: string) {
    return this.payrollPeriodRepository
      .createQueryBuilder('period')
      .where('period.company_id = :companyId', { companyId })
      .andWhere('period.branch_id = :branchId', { branchId })
      .andWhere('period.deleted_at IS NULL')
      .andWhere('period.period_start <= :effectiveDate', { effectiveDate })
      .andWhere('period.period_end >= :effectiveDate', { effectiveDate })
      .orderBy('period.periodStart', 'DESC')
      .getOne();
  }

  private async loadPayrollNovelty(id: number) {
    return this.payrollNoveltyRepository.findOne({ where: { id, deletedAt: IsNull() }, relations: { period: true } });
  }

  private async loadIncapacityForSync(id: number) {
    return this.incapacityRepository.findOneOrFail({
      where: { id, deletedAt: IsNull() },
      relations: { person: true, branch: true, payrollNovelty: { period: true } },
    });
  }

  private async loadVacationForSync(id: number) {
    return this.vacationRepository.findOneOrFail({
      where: { id, deletedAt: IsNull() },
      relations: { person: true, branch: true, payrollNovelty: { period: true } },
    });
  }

  private async loadDisciplinaryActionForSync(id: number) {
    return this.disciplinaryActionRepository.findOneOrFail({
      where: { id, deletedAt: IsNull() },
      relations: { person: true, branch: true, payrollNovelty: { period: true } },
    });
  }

  private async findIncapacityOrFail(currentUser: CurrentUserContext, id: number) {
    const record = await this.incapacityRepository.findOne({
      where: { id, companyId: currentUser.companyId, deletedAt: IsNull() },
      relations: { person: true, branch: true, payrollNovelty: { period: true } },
    });
    if (!record) {
      throw new NotFoundException('HR incapacity not found');
    }
    assertBranchAccess(currentUser, record.branchId, 'HR incapacity not found');
    return record;
  }

  private async findVacationOrFail(currentUser: CurrentUserContext, id: number) {
    const record = await this.vacationRepository.findOne({
      where: { id, companyId: currentUser.companyId, deletedAt: IsNull() },
      relations: { person: true, branch: true, payrollNovelty: { period: true } },
    });
    if (!record) {
      throw new NotFoundException('HR vacation not found');
    }
    assertBranchAccess(currentUser, record.branchId, 'HR vacation not found');
    return record;
  }

  private async findDisciplinaryActionOrFail(currentUser: CurrentUserContext, id: number) {
    const record = await this.disciplinaryActionRepository.findOne({
      where: { id, companyId: currentUser.companyId, deletedAt: IsNull() },
      relations: { person: true, branch: true, payrollNovelty: { period: true } },
    });
    if (!record) {
      throw new NotFoundException('HR disciplinary action not found');
    }
    assertBranchAccess(currentUser, record.branchId, 'HR disciplinary action not found');
    return record;
  }

  private async ensureBranch(companyId: number, branchId: number) {
    const branch = await this.branchRepository.findOne({ where: { id: branchId, companyId, deletedAt: IsNull() } });
    if (!branch) {
      throw new BadRequestException('Branch is invalid');
    }
    return branch;
  }

  private async ensurePerson(companyId: number, branchId: number, personId: number) {
    const person = await this.personRepository.findOne({ where: { id: personId, companyId, deletedAt: IsNull() } });
    if (!person) {
      throw new BadRequestException('Person is invalid');
    }
    if (person.branchId !== null && person.branchId !== branchId) {
      throw new BadRequestException('Person does not belong to the selected branch');
    }
    return person;
  }

  private serializeIncapacity(record: HrIncapacity) {
    return {
      id: record.id,
      companyId: record.companyId,
      branchId: record.branchId,
      personId: record.personId,
      reason: record.reason,
      startsAt: record.startsAt,
      endsAt: record.endsAt,
      dayCount: this.calculateDayCount(record.startsAt, record.endsAt),
      supportUrl: record.supportUrl,
      status: record.status,
      notes: record.notes,
      payrollNoveltyId: record.payrollNoveltyId,
      payrollPeriodLabel: record.payrollNovelty?.period?.label ?? null,
      personName: `${record.person.firstName} ${record.person.lastName}`.trim(),
      personType: record.person.personType as PersonType,
      branchName: record.branch ? `${record.branch.name} (${record.branch.code})` : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
    };
  }

  private serializeVacation(record: HrVacation) {
    return {
      id: record.id,
      companyId: record.companyId,
      branchId: record.branchId,
      personId: record.personId,
      reason: record.reason,
      startsAt: record.startsAt,
      endsAt: record.endsAt,
      dayCount: this.calculateDayCount(record.startsAt, record.endsAt),
      isPaid: record.isPaid,
      status: record.status,
      notes: record.notes,
      payrollNoveltyId: record.payrollNoveltyId,
      payrollPeriodLabel: record.payrollNovelty?.period?.label ?? null,
      personName: `${record.person.firstName} ${record.person.lastName}`.trim(),
      personType: record.person.personType as PersonType,
      branchName: record.branch ? `${record.branch.name} (${record.branch.code})` : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
    };
  }

  private serializeDisciplinaryAction(record: HrDisciplinaryAction) {
    return {
      id: record.id,
      companyId: record.companyId,
      branchId: record.branchId,
      personId: record.personId,
      actionType: record.actionType,
      title: record.title,
      effectiveDate: record.effectiveDate,
      supportUrl: record.supportUrl,
      payrollImpactAmount: record.payrollImpactAmount === null ? null : this.formatNumeric(this.parseNumeric(record.payrollImpactAmount)),
      status: record.status,
      notes: record.notes,
      payrollNoveltyId: record.payrollNoveltyId,
      payrollPeriodLabel: record.payrollNovelty?.period?.label ?? null,
      personName: `${record.person.firstName} ${record.person.lastName}`.trim(),
      personType: record.person.personType as PersonType,
      branchName: record.branch ? `${record.branch.name} (${record.branch.code})` : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
    };
  }

  private parseHrRequestStatus(value?: string) {
    if (!value) {
      return HrRequestStatus.REQUESTED;
    }
    if (!Object.values(HrRequestStatus).includes(value as HrRequestStatus)) {
      throw new BadRequestException('HR request status is invalid');
    }
    return value as HrRequestStatus;
  }

  private parseDisciplinaryActionType(value: string) {
    if (!Object.values(HrDisciplinaryActionType).includes(value as HrDisciplinaryActionType)) {
      throw new BadRequestException('HR disciplinary action type is invalid');
    }
    return value as HrDisciplinaryActionType;
  }

  private assertSingleDate(value: string, message: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(message);
    }
  }

  private assertDateRange(startsAt: string, endsAt: string, message: string) {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('HR request dates are invalid');
    }
    if (end.getTime() < start.getTime()) {
      throw new BadRequestException(message);
    }
  }

  private calculateDayCount(startsAt: string, endsAt: string) {
    const start = new Date(`${startsAt}T00:00:00.000Z`);
    const end = new Date(`${endsAt}T00:00:00.000Z`);
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  }

  private buildHrNotes(notes: string | null, supportUrl: string | null) {
    const values = [notes, supportUrl ? `Soporte: ${supportUrl}` : null].filter(Boolean);
    return values.length ? values.join(' | ') : null;
  }

  private normalizeString(value: string | null | undefined) {
    const normalized = typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
    return normalized || null;
  }

  private normalizeNumericString(value: string | null | undefined) {
    const normalized = this.normalizeString(value);
    if (!normalized) {
      return null;
    }
    if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
      throw new BadRequestException('Numeric value is invalid');
    }
    return normalized;
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

  private requireBranchId(branchId: number | null, label: string) {
    if (branchId === null) {
      throw new BadRequestException(`Branch is required for ${label}`);
    }
    return branchId;
  }
}
