import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { assertBranchAccess, resolveBranchFilter, resolveWritableBranchId } from '../../common/utils/tenant-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Branch } from '../../database/entities/branch.entity';
import { GoalStatus, PersonType } from '../../database/entities/enums';
import { GoalRecordEntity } from '../../database/entities/goal-record.entity';
import { OperationShift } from '../../database/entities/operation-shift.entity';
import { Person } from '../../database/entities/person.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { GoalsQueryDto } from './dto/goals-query.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

type RequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class GoalsService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(GoalRecordEntity)
    private readonly goalRepository: Repository<GoalRecordEntity>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(OperationShift)
    private readonly shiftRepository: Repository<OperationShift>,
  ) {}

  async list(currentUser: CurrentUserContext, query: GoalsQueryDto) {
    const qb = this.goalRepository.createQueryBuilder('goal');
    qb.leftJoinAndSelect('goal.person', 'person')
      .leftJoinAndSelect('goal.branch', 'branch')
      .leftJoinAndSelect('goal.shift', 'shift')
      .where('goal.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('goal.deleted_at IS NULL');

    const branchId = resolveBranchFilter(currentUser, query.branchId);
    if (branchId !== null) {
      qb.andWhere('goal.branch_id = :branchId', { branchId });
    }

    if (query.personId) {
      qb.andWhere('goal.person_id = :personId', { personId: query.personId });
    }

    if (query.shiftId) {
      qb.andWhere('goal.shift_id = :shiftId', { shiftId: query.shiftId });
    }

    if (query.status) {
      qb.andWhere('goal.status = :status', { status: query.status });
    }

    if (query.from) {
      qb.andWhere('goal.period_start >= :from', { from: query.from });
    }

    if (query.to) {
      qb.andWhere('goal.period_end <= :to', { to: query.to });
    }

    if (query.search) {
      qb.andWhere(
        `(
          goal.title ILIKE :search
          OR goal.notes ILIKE :search
          OR person.first_name ILIKE :search
          OR person.last_name ILIKE :search
          OR shift.title ILIKE :search
        )`,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('goal.periodStart', 'DESC')
      .addOrderBy('goal.createdAt', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items: items.map((item) => this.serializeGoal(item)), total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(currentUser: CurrentUserContext, id: number) {
    const goal = await this.findGoalOrFail(currentUser, id);
    return { data: this.serializeGoal(goal) };
  }

  async create(currentUser: CurrentUserContext, dto: CreateGoalDto, requestMeta?: RequestMeta) {
    const branchId = this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId));
    const branch = await this.ensureBranch(currentUser.companyId, branchId);
    const person = await this.ensurePerson(currentUser.companyId, branchId, dto.personId);
    const shift = await this.resolveShift(currentUser.companyId, branchId, person.id, dto.shiftId ?? null);
    this.assertPeriod(dto.periodStart, dto.periodEnd);

    const goal = await this.goalRepository.save(
      this.goalRepository.create({
        companyId: currentUser.companyId,
        branchId,
        personId: person.id,
        shiftId: shift?.id ?? null,
        title: dto.title.trim(),
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
        targetAmount: this.normalizeRequiredNumericString(dto.targetAmount, 'Goal target amount is required'),
        achievedAmount: this.normalizeNumericString(dto.achievedAmount),
        bonusAmount: this.normalizeNumericString(dto.bonusAmount),
        status: this.parseGoalStatus(dto.status),
        notes: this.normalizeString(dto.notes),
      }),
    );

    const created = await this.goalRepository.findOneOrFail({ where: { id: goal.id }, relations: { person: true, branch: true, shift: true } });

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'goals',
      action: 'create',
      entityType: 'goal_record',
      entityId: String(created.id),
      afterData: this.serializeGoal(created),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeGoal(created) };
  }

  async update(currentUser: CurrentUserContext, id: number, dto: UpdateGoalDto, requestMeta?: RequestMeta) {
    const existing = await this.findGoalOrFail(currentUser, id);
    const nextBranchId = dto.branchId !== undefined ? this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId)) : existing.branchId;
    const branch = await this.ensureBranch(currentUser.companyId, nextBranchId);
    const nextPersonId = dto.personId !== undefined ? dto.personId : existing.personId;
    const person = await this.ensurePerson(currentUser.companyId, nextBranchId, nextPersonId);
    const nextShiftId = dto.shiftId !== undefined ? dto.shiftId ?? null : existing.shiftId;
    await this.resolveShift(currentUser.companyId, nextBranchId, person.id, nextShiftId);
    const nextPeriodStart = dto.periodStart !== undefined ? dto.periodStart : existing.periodStart;
    const nextPeriodEnd = dto.periodEnd !== undefined ? dto.periodEnd : existing.periodEnd;
    this.assertPeriod(nextPeriodStart, nextPeriodEnd);
    const before = this.serializeGoal(existing);

    await this.goalRepository.update(
      { id },
      {
        ...(dto.branchId !== undefined ? { branchId: nextBranchId } : {}),
        ...(dto.personId !== undefined ? { personId: dto.personId } : {}),
        ...(dto.shiftId !== undefined ? { shiftId: dto.shiftId ?? null } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.periodStart !== undefined ? { periodStart: dto.periodStart } : {}),
        ...(dto.periodEnd !== undefined ? { periodEnd: dto.periodEnd } : {}),
        ...(dto.targetAmount !== undefined ? { targetAmount: this.normalizeRequiredNumericString(dto.targetAmount, 'Goal target amount is required') } : {}),
        ...(dto.achievedAmount !== undefined ? { achievedAmount: this.normalizeNumericString(dto.achievedAmount) } : {}),
        ...(dto.bonusAmount !== undefined ? { bonusAmount: this.normalizeNumericString(dto.bonusAmount) } : {}),
        ...(dto.status !== undefined ? { status: this.parseGoalStatus(dto.status) } : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeString(dto.notes) } : {}),
      },
    );

    const goal = await this.findGoalOrFail(currentUser, id);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'goals',
      action: 'edit',
      entityType: 'goal_record',
      entityId: String(id),
      beforeData: before,
      afterData: this.serializeGoal(goal),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeGoal(goal) };
  }

  private async findGoalOrFail(currentUser: CurrentUserContext, id: number) {
    const goal = await this.goalRepository.findOne({
      where: { id, companyId: currentUser.companyId, deletedAt: IsNull() },
      relations: { person: true, branch: true, shift: true },
    });
    if (!goal) {
      throw new NotFoundException('Goal record not found');
    }

    assertBranchAccess(currentUser, goal.branchId, 'Goal record not found');
    return goal;
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

  private async resolveShift(companyId: number, branchId: number, personId: number, shiftId: number | null) {
    if (shiftId === null) {
      return null;
    }

    const shift = await this.shiftRepository.findOne({ where: { id: shiftId, companyId, deletedAt: IsNull() } });
    if (!shift) {
      throw new BadRequestException('Shift is invalid');
    }
    if (shift.branchId !== branchId || shift.personId !== personId) {
      throw new BadRequestException('Shift does not match the selected branch and person');
    }
    return shift;
  }

  private serializeGoal(goal: GoalRecordEntity) {
    return {
      id: goal.id,
      companyId: goal.companyId,
      branchId: goal.branchId,
      personId: goal.personId,
      shiftId: goal.shiftId,
      title: goal.title,
      periodStart: goal.periodStart,
      periodEnd: goal.periodEnd,
      targetAmount: String(goal.targetAmount),
      achievedAmount: goal.achievedAmount === null ? null : String(goal.achievedAmount),
      bonusAmount: goal.bonusAmount === null ? null : String(goal.bonusAmount),
      status: goal.status,
      notes: goal.notes,
      personName: `${goal.person.firstName} ${goal.person.lastName}`.trim(),
      personType: goal.person.personType as PersonType,
      shiftTitle: goal.shift?.title ?? null,
      branchName: goal.branch ? `${goal.branch.name} (${goal.branch.code})` : null,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
      deletedAt: goal.deletedAt ? goal.deletedAt.toISOString() : null,
    };
  }

  private assertPeriod(periodStart: string, periodEnd: string) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Goal period is invalid');
    }
    if (end.getTime() < start.getTime()) {
      throw new BadRequestException('Goal period end must be greater than or equal to start');
    }
  }

  private parseGoalStatus(value?: string) {
    if (!value) {
      return GoalStatus.DRAFT;
    }

    if (!Object.values(GoalStatus).includes(value as GoalStatus)) {
      throw new BadRequestException('Goal status is invalid');
    }

    return value as GoalStatus;
  }

  private normalizeString(value: string | null | undefined) {
    const normalized = (value || '').trim();
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

  private normalizeRequiredNumericString(value: string | null | undefined, message: string) {
    const normalized = this.normalizeNumericString(value);
    if (!normalized) {
      throw new BadRequestException(message);
    }
    return normalized;
  }

  private requireBranchId(branchId: number | null) {
    if (branchId === null) {
      throw new BadRequestException('Branch is required for goals');
    }
    return branchId;
  }
}
