import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { assertBranchAccess, resolveBranchFilter, resolveWritableBranchId } from '../../common/utils/tenant-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AbsenceRecordEntity } from '../../database/entities/absence-record.entity';
import { AttendanceRecordEntity } from '../../database/entities/attendance-record.entity';
import { Branch } from '../../database/entities/branch.entity';
import { GoalRecordEntity } from '../../database/entities/goal-record.entity';
import { AttendanceStatus, PayrollPeriodStatus } from '../../database/entities/enums';
import { OnlineSession } from '../../database/entities/online-session.entity';
import { PayrollNovelty } from '../../database/entities/payroll-novelty.entity';
import { PayrollPeriod } from '../../database/entities/payroll-period.entity';
import { PayrollRun } from '../../database/entities/payroll-run.entity';
import { PersonContract } from '../../database/entities/person-contract.entity';
import { Person } from '../../database/entities/person.entity';
import { CreatePayrollPeriodDto } from './dto/create-payroll-period.dto';
import { PayrollPeriodsQueryDto } from './dto/payroll-periods-query.dto';
import { UpdatePayrollPeriodDto } from './dto/update-payroll-period.dto';

type RequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

type PayrollSummaryItem = {
  personId: number;
  personName: string;
  personType: string;
  fixedCompensationAmount: string | null;
  attendanceCount: number;
  lateCount: number;
  absenceCount: number;
  approvedAbsenceCount: number;
  pendingAbsenceCount: number;
  onlineSessionCount: number;
  onlineMinutes: number;
  tokenCount: number;
  grossAmount: string;
  noveltyCount: number;
  approvedNoveltyCount: number;
  pendingCriticalNoveltyCount: number;
  noveltyAmount: string;
  goalTargetAmount: string;
  goalAchievedAmount: string;
  goalBonusAmount: string;
  projectedCompensationAmount: string;
  components: Array<{
    code: string;
    label: string;
    amount: string;
    direction: 'earning' | 'deduction';
    sourceType: 'contract' | 'goal' | 'novelty';
    sourceId: number | null;
    detail: string | null;
  }>;
  alerts: Array<{
    code: string;
    label: string;
    severity: 'warning';
    sourceType: 'absence' | 'novelty';
    sourceId: number | null;
  }>;
};

type PayrollSummaryTotals = {
  peopleCount: number;
  attendanceCount: number;
  lateCount: number;
  absenceCount: number;
  approvedAbsenceCount: number;
  pendingAbsenceCount: number;
  onlineSessionCount: number;
  onlineMinutes: number;
  tokenCount: number;
  grossAmount: string;
  noveltyCount: number;
  approvedNoveltyCount: number;
  pendingCriticalNoveltyCount: number;
  noveltyAmount: string;
  goalBonusAmount: string;
  fixedCompensationAmount: string;
  projectedCompensationAmount: string;
};

@Injectable()
export class PayrollService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(PayrollPeriod)
    private readonly payrollPeriodRepository: Repository<PayrollPeriod>,
    @InjectRepository(PayrollRun)
    private readonly payrollRunRepository: Repository<PayrollRun>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(PersonContract)
    private readonly personContractRepository: Repository<PersonContract>,
    @InjectRepository(AttendanceRecordEntity)
    private readonly attendanceRepository: Repository<AttendanceRecordEntity>,
    @InjectRepository(AbsenceRecordEntity)
    private readonly absenceRepository: Repository<AbsenceRecordEntity>,
    @InjectRepository(OnlineSession)
    private readonly onlineSessionRepository: Repository<OnlineSession>,
    @InjectRepository(GoalRecordEntity)
    private readonly goalRepository: Repository<GoalRecordEntity>,
    @InjectRepository(PayrollNovelty)
    private readonly payrollNoveltyRepository: Repository<PayrollNovelty>,
  ) {}

  async list(currentUser: CurrentUserContext, query: PayrollPeriodsQueryDto) {
    const qb = this.payrollPeriodRepository.createQueryBuilder('period');
    qb.leftJoinAndSelect('period.branch', 'branch')
      .where('period.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('period.deleted_at IS NULL');

    const branchId = resolveBranchFilter(currentUser, query.branchId);
    if (branchId !== null) {
      qb.andWhere('period.branch_id = :branchId', { branchId });
    }

    if (query.status) {
      qb.andWhere('period.status = :status', { status: query.status });
    }

    if (query.from) {
      qb.andWhere('period.period_start >= :from', { from: query.from });
    }

    if (query.to) {
      qb.andWhere('period.period_end <= :to', { to: query.to });
    }

    if (query.search) {
      qb.andWhere('(period.code ILIKE :search OR period.label ILIKE :search OR period.notes ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('period.periodStart', 'DESC').skip((query.page - 1) * query.pageSize).take(query.pageSize);
    const [items, total] = await qb.getManyAndCount();
    return { items: items.map((item) => this.serializePayrollPeriod(item)), total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(currentUser: CurrentUserContext, id: number) {
    const period = await this.findPayrollPeriodOrFail(currentUser, id);
    return { data: await this.buildPayrollPeriodDetail(period) };
  }

  async create(currentUser: CurrentUserContext, dto: CreatePayrollPeriodDto, requestMeta?: RequestMeta) {
    const branchId = this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId));
    const branch = await this.ensureBranch(currentUser.companyId, branchId);
    this.assertPeriod(dto.periodStart, dto.periodEnd);
    const code = this.normalizeCode(dto.code);
    await this.ensureUniqueCode(currentUser.companyId, branchId, code);

    const period = await this.payrollPeriodRepository.save(
      this.payrollPeriodRepository.create({
        companyId: currentUser.companyId,
        branchId,
        code,
        label: dto.label.trim(),
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
        status: PayrollPeriodStatus.DRAFT,
        notes: this.normalizeString(dto.notes),
      }),
    );

    const created = await this.payrollPeriodRepository.findOneOrFail({ where: { id: period.id }, relations: { branch: true } });
    const detail = await this.buildPayrollPeriodDetail(created);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'payroll',
      action: 'create',
      entityType: 'payroll_period',
      entityId: String(created.id),
      afterData: detail,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: detail };
  }

  async update(currentUser: CurrentUserContext, id: number, dto: UpdatePayrollPeriodDto, requestMeta?: RequestMeta) {
    const existing = await this.findPayrollPeriodOrFail(currentUser, id);
    if (existing.status === PayrollPeriodStatus.CLOSED) {
      throw new BadRequestException('Closed payroll periods must be reopened before editing');
    }

    const nextBranchId = dto.branchId !== undefined ? this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId)) : existing.branchId;
    const branch = await this.ensureBranch(currentUser.companyId, nextBranchId);
    const nextPeriodStart = dto.periodStart ?? existing.periodStart;
    const nextPeriodEnd = dto.periodEnd ?? existing.periodEnd;
    this.assertPeriod(nextPeriodStart, nextPeriodEnd);
    const nextCode = dto.code !== undefined ? this.normalizeCode(dto.code) : existing.code;
    if (nextCode !== existing.code || nextBranchId !== existing.branchId) {
      await this.ensureUniqueCode(currentUser.companyId, nextBranchId, nextCode, existing.id);
    }

    const before = await this.buildPayrollPeriodDetail(existing);
    await this.payrollPeriodRepository.update(
      { id },
      {
        ...(dto.branchId !== undefined ? { branchId: nextBranchId } : {}),
        ...(dto.code !== undefined ? { code: nextCode } : {}),
        ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
        ...(dto.periodStart !== undefined ? { periodStart: dto.periodStart } : {}),
        ...(dto.periodEnd !== undefined ? { periodEnd: dto.periodEnd } : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeString(dto.notes) } : {}),
      },
    );

    const updated = await this.findPayrollPeriodOrFail(currentUser, id);
    const detail = await this.buildPayrollPeriodDetail(updated);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'payroll',
      action: 'edit',
      entityType: 'payroll_period',
      entityId: String(id),
      beforeData: before,
      afterData: detail,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: detail };
  }

  async calculate(currentUser: CurrentUserContext, id: number, requestMeta?: RequestMeta) {
    const period = await this.findPayrollPeriodOrFail(currentUser, id);
    if (period.status === PayrollPeriodStatus.CLOSED) {
      throw new BadRequestException('Closed payroll periods must be reopened before recalculation');
    }

    const before = await this.buildPayrollPeriodDetail(period);
    const summary = await this.buildPayrollSummary(period);
    const latestRun = await this.payrollRunRepository.findOne({ where: { periodId: period.id }, order: { runNumber: 'DESC' } });
    const run = await this.payrollRunRepository.save(
      this.payrollRunRepository.create({
        companyId: period.companyId,
        branchId: period.branchId,
        periodId: period.id,
        runNumber: (latestRun?.runNumber ?? 0) + 1,
        totals: summary.totals,
        items: summary.items,
      }),
    );

    await this.payrollPeriodRepository.update(
      { id: period.id },
      { status: PayrollPeriodStatus.CALCULATED, lastCalculatedAt: new Date() },
    );

    const updated = await this.findPayrollPeriodOrFail(currentUser, id);
    const detail = await this.buildPayrollPeriodDetail(updated, run);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? period.branchId,
      userId: currentUser.id,
      module: 'payroll',
      action: 'calculate',
      entityType: 'payroll_period',
      entityId: String(id),
      beforeData: before,
      afterData: detail,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
      meta: { runNumber: run.runNumber },
    });

    return { data: detail };
  }

  async close(currentUser: CurrentUserContext, id: number, requestMeta?: RequestMeta) {
    const period = await this.findPayrollPeriodOrFail(currentUser, id);
    if (period.status !== PayrollPeriodStatus.CALCULATED) {
      throw new BadRequestException('Only calculated payroll periods can be closed');
    }

    const latestRun = await this.getLatestPayrollRun(period.id);
    if (!latestRun) {
      throw new BadRequestException('Payroll period requires at least one calculation before closing');
    }

    const totals = latestRun.totals as Record<string, unknown>;
    if (Number(totals.pendingAbsenceCount ?? 0) > 0) {
      throw new BadRequestException('Payroll period cannot close while reported absences remain pending');
    }
    if (Number(totals.pendingCriticalNoveltyCount ?? 0) > 0) {
      throw new BadRequestException('Payroll period cannot close while critical payroll novelties remain pending');
    }

    const before = await this.buildPayrollPeriodDetail(period, latestRun);
    await this.payrollPeriodRepository.update({ id }, { status: PayrollPeriodStatus.CLOSED, closedAt: new Date() });
    const updated = await this.findPayrollPeriodOrFail(currentUser, id);
    const detail = await this.buildPayrollPeriodDetail(updated, latestRun);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? period.branchId,
      userId: currentUser.id,
      module: 'payroll',
      action: 'close',
      entityType: 'payroll_period',
      entityId: String(id),
      beforeData: before,
      afterData: detail,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: detail };
  }

  async reopen(currentUser: CurrentUserContext, id: number, requestMeta?: RequestMeta) {
    const period = await this.findPayrollPeriodOrFail(currentUser, id);
    if (period.status !== PayrollPeriodStatus.CLOSED) {
      throw new BadRequestException('Only closed payroll periods can be reopened');
    }

    const latestRun = await this.getLatestPayrollRun(period.id);
    const before = await this.buildPayrollPeriodDetail(period, latestRun);
    await this.payrollPeriodRepository.update(
      { id },
      { status: latestRun ? PayrollPeriodStatus.CALCULATED : PayrollPeriodStatus.DRAFT, closedAt: null },
    );

    const updated = await this.findPayrollPeriodOrFail(currentUser, id);
    const detail = await this.buildPayrollPeriodDetail(updated, latestRun);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? period.branchId,
      userId: currentUser.id,
      module: 'payroll',
      action: 'reopen',
      entityType: 'payroll_period',
      entityId: String(id),
      beforeData: before,
      afterData: detail,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: detail };
  }

  async exportCsv(currentUser: CurrentUserContext, id: number) {
    const period = await this.findPayrollPeriodOrFail(currentUser, id);
    const detail = await this.buildPayrollPeriodDetail(period);
    const runItems = (detail.latestRun?.items ?? []) as Array<{
      personName: string;
      personType: string;
      fixedCompensationAmount: string | null;
      noveltyAmount: string;
      goalBonusAmount: string;
      projectedCompensationAmount: string;
      alerts: Array<{ label: string }>;
      components: Array<{ label: string; amount: string }>;
    }>;
    const rows = [
      ['period_code', 'period_label', 'person_name', 'person_type', 'fixed_amount', 'novelty_amount', 'goal_bonus_amount', 'projected_amount', 'alerts', 'components'],
      ...runItems.map((item) => [
        detail.code,
        detail.label,
        item.personName,
        item.personType,
        item.fixedCompensationAmount ?? '',
        item.noveltyAmount,
        item.goalBonusAmount,
        item.projectedCompensationAmount,
        item.alerts.map((alert) => alert.label).join(' | '),
        item.components.map((component) => `${component.label}:${component.amount}`).join(' | '),
      ]),
    ];

    return rows.map((row) => row.map((value) => this.csvCell(value)).join(',')).join('\n');
  }

  private async buildPayrollPeriodDetail(period: PayrollPeriod, latestRunOverride?: PayrollRun | null) {
    const latestRun = latestRunOverride === undefined ? await this.getLatestPayrollRun(period.id) : latestRunOverride;
    return {
      ...this.serializePayrollPeriod(period),
      latestRun: latestRun ? this.serializePayrollRun(latestRun) : null,
    };
  }

  private async buildPayrollSummary(period: PayrollPeriod) {
    const periodStart = this.startOfDay(period.periodStart);
    const periodEnd = this.endOfDay(period.periodEnd);

    const [contracts, attendances, absences, onlineSessions, goals, novelties] = await Promise.all([
      this.personContractRepository.find({
        where: { companyId: period.companyId, deletedAt: IsNull() },
        relations: { person: true },
        order: { startsAt: 'DESC', createdAt: 'DESC' },
      }),
      this.attendanceRepository.find({
        where: { companyId: period.companyId, branchId: period.branchId, deletedAt: IsNull() },
        relations: { person: true, branch: true, shift: true },
      }),
      this.absenceRepository.find({
        where: { companyId: period.companyId, branchId: period.branchId, deletedAt: IsNull() },
        relations: { person: true, branch: true, shift: true },
      }),
      this.onlineSessionRepository.find({
        where: { companyId: period.companyId, branchId: period.branchId, deletedAt: IsNull() },
        relations: { person: true, branch: true, shift: true },
      }),
      this.goalRepository.find({
        where: { companyId: period.companyId, branchId: period.branchId, deletedAt: IsNull() },
        relations: { person: true, branch: true, shift: true },
      }),
      this.payrollNoveltyRepository.find({
        where: { companyId: period.companyId, branchId: period.branchId, periodId: period.id, deletedAt: IsNull() },
        relations: { person: true, branch: true, period: true },
      }),
    ]);

    const relevantAttendances = attendances.filter((item) => item.attendanceDate >= period.periodStart && item.attendanceDate <= period.periodEnd);
    const relevantAbsences = absences.filter((item) => {
      const startsAt = item.startsAt;
      const endsAt = item.endsAt ?? item.startsAt;
      return startsAt.getTime() <= periodEnd.getTime() && endsAt.getTime() >= periodStart.getTime();
    });
    const relevantOnlineSessions = onlineSessions.filter((item) => item.startedAt.getTime() >= periodStart.getTime() && item.startedAt.getTime() <= periodEnd.getTime());
    const relevantGoals = goals.filter((item) => item.periodStart <= period.periodEnd && item.periodEnd >= period.periodStart);
    const relevantNovelties = novelties.filter((item) => item.effectiveDate >= period.periodStart && item.effectiveDate <= period.periodEnd);
    const relevantContracts = contracts.filter((item) => {
      const startsAt = this.startOfDay(item.startsAt);
      const endsAt = item.endsAt ? this.endOfDay(item.endsAt) : null;
      return startsAt.getTime() <= periodEnd.getTime() && (!endsAt || endsAt.getTime() >= periodStart.getTime());
    });

    const peopleMap = new Map<number, PayrollSummaryItem>();
    const ensureItem = (person: Person) => {
      const existing = peopleMap.get(person.id);
      if (existing) {
        return existing;
      }

      const created: PayrollSummaryItem = {
        personId: person.id,
        personName: `${person.firstName} ${person.lastName}`.trim(),
        personType: person.personType,
        fixedCompensationAmount: null,
        attendanceCount: 0,
        lateCount: 0,
        absenceCount: 0,
        approvedAbsenceCount: 0,
        pendingAbsenceCount: 0,
        onlineSessionCount: 0,
        onlineMinutes: 0,
        tokenCount: 0,
        grossAmount: '0',
        noveltyCount: 0,
        approvedNoveltyCount: 0,
        pendingCriticalNoveltyCount: 0,
        noveltyAmount: '0',
        goalTargetAmount: '0',
        goalAchievedAmount: '0',
        goalBonusAmount: '0',
        projectedCompensationAmount: '0',
        components: [],
        alerts: [],
      };
      peopleMap.set(person.id, created);
      return created;
    };

    for (const contract of relevantContracts) {
      const item = ensureItem(contract.person);
      if (item.fixedCompensationAmount === null) {
        item.fixedCompensationAmount = this.resolveContractFixedAmount(contract);
        if (item.fixedCompensationAmount !== null) {
          item.components.push({
            code: 'fixed_compensation',
            label: 'Compensacion fija',
            amount: item.fixedCompensationAmount,
            direction: 'earning',
            sourceType: 'contract',
            sourceId: contract.id,
            detail: contract.contractType,
          });
        }
      }
    }

    for (const attendance of relevantAttendances) {
      const item = ensureItem(attendance.person);
      item.attendanceCount += 1;
      if (attendance.status === AttendanceStatus.LATE) {
        item.lateCount += 1;
      }
    }

    for (const absence of relevantAbsences) {
      const item = ensureItem(absence.person);
      item.absenceCount += 1;
      if (absence.status === 'approved') {
        item.approvedAbsenceCount += 1;
      }
      if (absence.status === 'reported') {
        item.pendingAbsenceCount += 1;
        item.alerts.push({
          code: 'pending_absence',
          label: `Ausencia pendiente: ${absence.reason}`,
          severity: 'warning',
          sourceType: 'absence',
          sourceId: absence.id,
        });
      }
    }

    for (const onlineSession of relevantOnlineSessions) {
      const item = ensureItem(onlineSession.person);
      item.onlineSessionCount += 1;
      item.onlineMinutes += this.calculateDurationMinutes(onlineSession.startedAt, onlineSession.endedAt);
      item.tokenCount += onlineSession.tokenCount ?? 0;
      item.grossAmount = this.formatNumeric(this.parseNumeric(item.grossAmount) + this.parseNumeric(onlineSession.grossAmount));
    }

    for (const goal of relevantGoals) {
      const item = ensureItem(goal.person);
      item.goalTargetAmount = this.formatNumeric(this.parseNumeric(item.goalTargetAmount) + this.parseNumeric(goal.targetAmount));
      item.goalAchievedAmount = this.formatNumeric(this.parseNumeric(item.goalAchievedAmount) + this.parseNumeric(goal.achievedAmount));
      if (goal.status === 'closed') {
        item.goalBonusAmount = this.formatNumeric(this.parseNumeric(item.goalBonusAmount) + this.parseNumeric(goal.bonusAmount));
        if (this.parseNumeric(goal.bonusAmount) !== 0) {
          item.components.push({
            code: 'goal_bonus',
            label: `Bono meta: ${goal.title}`,
            amount: this.formatNumeric(this.parseNumeric(goal.bonusAmount)),
            direction: 'earning',
            sourceType: 'goal',
            sourceId: goal.id,
            detail: `${goal.periodStart} -> ${goal.periodEnd}`,
          });
        }
      }
    }

    for (const novelty of relevantNovelties) {
      const item = ensureItem(novelty.person);
      item.noveltyCount += 1;
      if (novelty.status === 'approved') {
        item.approvedNoveltyCount += 1;
        const signedAmount = this.resolveNoveltySignedAmount(novelty.noveltyType, novelty.amount);
        item.noveltyAmount = this.formatNumeric(this.parseNumeric(item.noveltyAmount) + signedAmount);
        item.components.push({
          code: 'payroll_novelty',
          label: novelty.title,
          amount: this.formatNumeric(signedAmount),
          direction: signedAmount < 0 ? 'deduction' : 'earning',
          sourceType: 'novelty',
          sourceId: novelty.id,
          detail: `${novelty.noveltyType} · ${novelty.effectiveDate}`,
        });
      }
      if (novelty.status === 'pending' && novelty.isCritical) {
        item.pendingCriticalNoveltyCount += 1;
        item.alerts.push({
          code: 'pending_critical_novelty',
          label: `Novedad critica pendiente: ${novelty.title}`,
          severity: 'warning',
          sourceType: 'novelty',
          sourceId: novelty.id,
        });
      }
    }

    const items = [...peopleMap.values()]
      .map((item) => ({
        ...item,
        fixedCompensationAmount: item.fixedCompensationAmount === null ? null : this.formatNumeric(this.parseNumeric(item.fixedCompensationAmount)),
        projectedCompensationAmount: this.formatNumeric(
          this.parseNumeric(item.fixedCompensationAmount) + this.parseNumeric(item.goalBonusAmount) + this.parseNumeric(item.noveltyAmount),
        ),
      }))
      .sort((left, right) => left.personName.localeCompare(right.personName, 'es'));

    const totals = items.reduce<PayrollSummaryTotals>(
      (acc, item) => ({
        peopleCount: acc.peopleCount + 1,
        attendanceCount: acc.attendanceCount + item.attendanceCount,
        lateCount: acc.lateCount + item.lateCount,
        absenceCount: acc.absenceCount + item.absenceCount,
        approvedAbsenceCount: acc.approvedAbsenceCount + item.approvedAbsenceCount,
        pendingAbsenceCount: acc.pendingAbsenceCount + item.pendingAbsenceCount,
        onlineSessionCount: acc.onlineSessionCount + item.onlineSessionCount,
        onlineMinutes: acc.onlineMinutes + item.onlineMinutes,
        tokenCount: acc.tokenCount + item.tokenCount,
        grossAmount: this.formatNumeric(this.parseNumeric(acc.grossAmount) + this.parseNumeric(item.grossAmount)),
        noveltyCount: acc.noveltyCount + item.noveltyCount,
        approvedNoveltyCount: acc.approvedNoveltyCount + item.approvedNoveltyCount,
        pendingCriticalNoveltyCount: acc.pendingCriticalNoveltyCount + item.pendingCriticalNoveltyCount,
        noveltyAmount: this.formatNumeric(this.parseNumeric(acc.noveltyAmount) + this.parseNumeric(item.noveltyAmount)),
        goalBonusAmount: this.formatNumeric(this.parseNumeric(acc.goalBonusAmount) + this.parseNumeric(item.goalBonusAmount)),
        fixedCompensationAmount: this.formatNumeric(this.parseNumeric(acc.fixedCompensationAmount) + this.parseNumeric(item.fixedCompensationAmount)),
        projectedCompensationAmount: this.formatNumeric(this.parseNumeric(acc.projectedCompensationAmount) + this.parseNumeric(item.projectedCompensationAmount)),
      }),
      {
        peopleCount: 0,
        attendanceCount: 0,
        lateCount: 0,
        absenceCount: 0,
        approvedAbsenceCount: 0,
        pendingAbsenceCount: 0,
        onlineSessionCount: 0,
        onlineMinutes: 0,
        tokenCount: 0,
        grossAmount: '0',
        noveltyCount: 0,
        approvedNoveltyCount: 0,
        pendingCriticalNoveltyCount: 0,
        noveltyAmount: '0',
        goalBonusAmount: '0',
        fixedCompensationAmount: '0',
        projectedCompensationAmount: '0',
      },
    );

    return { items, totals };
  }

  private async findPayrollPeriodOrFail(currentUser: CurrentUserContext, id: number) {
    const period = await this.payrollPeriodRepository.findOne({
      where: { id, companyId: currentUser.companyId, deletedAt: IsNull() },
      relations: { branch: true },
    });
    if (!period) {
      throw new NotFoundException('Payroll period not found');
    }

    assertBranchAccess(currentUser, period.branchId, 'Payroll period not found');
    return period;
  }

  private async ensureBranch(companyId: number, branchId: number) {
    const branch = await this.branchRepository.findOne({ where: { id: branchId, companyId, deletedAt: IsNull() } });
    if (!branch) {
      throw new BadRequestException('Branch is invalid');
    }
    return branch;
  }

  private async ensureUniqueCode(companyId: number, branchId: number, code: string, excludeId?: number) {
    const existing = await this.payrollPeriodRepository.findOne({ where: { companyId, branchId, code, deletedAt: IsNull() } });
    if (existing && existing.id !== excludeId) {
      throw new BadRequestException('Payroll period code is already registered for this branch');
    }
  }

  private async getLatestPayrollRun(periodId: number) {
    return this.payrollRunRepository.findOne({ where: { periodId }, order: { runNumber: 'DESC' } });
  }

  private serializePayrollPeriod(period: PayrollPeriod) {
    return {
      id: period.id,
      companyId: period.companyId,
      branchId: period.branchId,
      code: period.code,
      label: period.label,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      status: period.status,
      notes: period.notes,
      lastCalculatedAt: period.lastCalculatedAt ? period.lastCalculatedAt.toISOString() : null,
      closedAt: period.closedAt ? period.closedAt.toISOString() : null,
      branchName: period.branch ? `${period.branch.name} (${period.branch.code})` : null,
      createdAt: period.createdAt.toISOString(),
      updatedAt: period.updatedAt.toISOString(),
      deletedAt: period.deletedAt ? period.deletedAt.toISOString() : null,
    };
  }

  private serializePayrollRun(run: PayrollRun) {
    return {
      id: run.id,
      periodId: run.periodId,
      companyId: run.companyId,
      branchId: run.branchId,
      runNumber: run.runNumber,
      totals: run.totals,
      items: run.items,
      generatedAt: run.createdAt.toISOString(),
    };
  }

  private resolveContractFixedAmount(contract: PersonContract) {
    const amount = contract.monthlySalary ?? contract.biweeklySalary ?? contract.dailySalary ?? null;
    return amount === null ? null : this.formatNumeric(this.parseNumeric(amount));
  }

  private startOfDay(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private endOfDay(value: string) {
    return new Date(`${value}T23:59:59.999Z`);
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

  private csvCell(value: string) {
    const normalized = String(value ?? '');
    if (/[",\n]/.test(normalized)) {
      return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
  }

  private resolveNoveltySignedAmount(type: string, value: string | number | null | undefined) {
    const numeric = this.parseNumeric(value);
    return type === 'deduction' ? -Math.abs(numeric) : Math.abs(numeric);
  }

  private calculateDurationMinutes(startedAt: Date, endedAt: Date | null) {
    if (!endedAt) {
      return 0;
    }
    return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));
  }

  private assertPeriod(periodStart: string, periodEnd: string) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Payroll period dates are invalid');
    }
    if (end.getTime() < start.getTime()) {
      throw new BadRequestException('Payroll period end must be greater than or equal to start');
    }
  }

  private normalizeCode(value: string) {
    const normalized = (value || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]+/g, '-');
    if (!normalized) {
      throw new BadRequestException('Payroll period code is invalid');
    }
    return normalized;
  }

  private normalizeString(value: string | null | undefined) {
    const normalized = (value || '').trim();
    return normalized || null;
  }

  private requireBranchId(branchId: number | null) {
    if (branchId === null) {
      throw new BadRequestException('Branch is required for payroll periods');
    }
    return branchId;
  }
}
