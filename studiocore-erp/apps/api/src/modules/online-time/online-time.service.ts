import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { assertBranchAccess, resolveBranchFilter, resolveWritableBranchId } from '../../common/utils/tenant-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Branch } from '../../database/entities/branch.entity';
import { OnlineSessionStatus, PersonType } from '../../database/entities/enums';
import { OnlineSession } from '../../database/entities/online-session.entity';
import { OperationShift } from '../../database/entities/operation-shift.entity';
import { Person } from '../../database/entities/person.entity';
import { CreateOnlineSessionDto } from './dto/create-online-session.dto';
import { OnlineTimeQueryDto } from './dto/online-time-query.dto';
import { UpdateOnlineSessionDto } from './dto/update-online-session.dto';

type RequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class OnlineTimeService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(OnlineSession)
    private readonly onlineSessionRepository: Repository<OnlineSession>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(OperationShift)
    private readonly shiftRepository: Repository<OperationShift>,
  ) {}

  async list(currentUser: CurrentUserContext, query: OnlineTimeQueryDto) {
    const qb = this.onlineSessionRepository.createQueryBuilder('session');
    qb.leftJoinAndSelect('session.person', 'person')
      .leftJoinAndSelect('session.branch', 'branch')
      .leftJoinAndSelect('session.shift', 'shift')
      .where('session.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('session.deleted_at IS NULL');

    const branchId = resolveBranchFilter(currentUser, query.branchId);
    if (branchId !== null) {
      qb.andWhere('session.branch_id = :branchId', { branchId });
    }

    if (query.personId) {
      qb.andWhere('session.person_id = :personId', { personId: query.personId });
    }

    if (query.shiftId) {
      qb.andWhere('session.shift_id = :shiftId', { shiftId: query.shiftId });
    }

    if (query.status) {
      qb.andWhere('session.status = :status', { status: query.status });
    }

    if (query.from) {
      qb.andWhere('session.started_at >= :from', { from: query.from });
    }

    if (query.to) {
      qb.andWhere('session.started_at <= :to', { to: query.to });
    }

    if (query.search) {
      qb.andWhere(
        `(
          session.label ILIKE :search
          OR session.platform_name ILIKE :search
          OR session.notes ILIKE :search
          OR person.first_name ILIKE :search
          OR person.last_name ILIKE :search
          OR shift.title ILIKE :search
        )`,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('session.startedAt', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items: items.map((item) => this.serializeOnlineSession(item)), total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(currentUser: CurrentUserContext, id: number) {
    const onlineSession = await this.findOnlineSessionOrFail(currentUser, id);
    return { data: this.serializeOnlineSession(onlineSession) };
  }

  async create(currentUser: CurrentUserContext, dto: CreateOnlineSessionDto, requestMeta?: RequestMeta) {
    const branchId = this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId));
    const branch = await this.ensureBranch(currentUser.companyId, branchId);
    const person = await this.ensurePerson(currentUser.companyId, branchId, dto.personId);
    const shift = await this.resolveShift(currentUser.companyId, branchId, person.id, dto.shiftId ?? null);
    const startedAt = this.parseDateTime(dto.startedAt, 'Online session start');
    const endedAt = dto.endedAt ? this.parseDateTime(dto.endedAt, 'Online session end') : null;
    this.assertDateRange(startedAt, endedAt);

    const onlineSession = await this.onlineSessionRepository.save(
      this.onlineSessionRepository.create({
        companyId: currentUser.companyId,
        branchId,
        personId: person.id,
        shiftId: shift?.id ?? null,
        label: dto.label.trim(),
        platformName: this.normalizeString(dto.platformName),
        startedAt,
        endedAt,
        tokenCount: dto.tokenCount ?? null,
        grossAmount: this.normalizeNumericString(dto.grossAmount),
        status: this.parseOnlineSessionStatus(dto.status),
        notes: this.normalizeString(dto.notes),
      }),
    );

    const created = await this.onlineSessionRepository.findOneOrFail({
      where: { id: onlineSession.id },
      relations: { person: true, branch: true, shift: true },
    });

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'online_time',
      action: 'create',
      entityType: 'online_session',
      entityId: String(created.id),
      afterData: this.serializeOnlineSession(created),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeOnlineSession(created) };
  }

  async update(currentUser: CurrentUserContext, id: number, dto: UpdateOnlineSessionDto, requestMeta?: RequestMeta) {
    const existing = await this.findOnlineSessionOrFail(currentUser, id);
    const nextBranchId = dto.branchId !== undefined ? this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId)) : existing.branchId;
    const branch = await this.ensureBranch(currentUser.companyId, nextBranchId);
    const nextPersonId = dto.personId !== undefined ? dto.personId : existing.personId;
    const person = await this.ensurePerson(currentUser.companyId, nextBranchId, nextPersonId);
    const nextShiftId = dto.shiftId !== undefined ? dto.shiftId ?? null : existing.shiftId;
    await this.resolveShift(currentUser.companyId, nextBranchId, person.id, nextShiftId);
    const startedAt = dto.startedAt !== undefined ? this.parseDateTime(dto.startedAt, 'Online session start') : existing.startedAt;
    const endedAt = dto.endedAt !== undefined ? (dto.endedAt ? this.parseDateTime(dto.endedAt, 'Online session end') : null) : existing.endedAt;
    this.assertDateRange(startedAt, endedAt);
    const before = this.serializeOnlineSession(existing);

    await this.onlineSessionRepository.update(
      { id },
      {
        ...(dto.branchId !== undefined ? { branchId: nextBranchId } : {}),
        ...(dto.personId !== undefined ? { personId: dto.personId } : {}),
        ...(dto.shiftId !== undefined ? { shiftId: dto.shiftId ?? null } : {}),
        ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
        ...(dto.platformName !== undefined ? { platformName: this.normalizeString(dto.platformName) } : {}),
        ...(dto.startedAt !== undefined ? { startedAt } : {}),
        ...(dto.endedAt !== undefined ? { endedAt } : {}),
        ...(dto.tokenCount !== undefined ? { tokenCount: dto.tokenCount ?? null } : {}),
        ...(dto.grossAmount !== undefined ? { grossAmount: this.normalizeNumericString(dto.grossAmount) } : {}),
        ...(dto.status !== undefined ? { status: this.parseOnlineSessionStatus(dto.status) } : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeString(dto.notes) } : {}),
      },
    );

    const onlineSession = await this.findOnlineSessionOrFail(currentUser, id);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'online_time',
      action: 'edit',
      entityType: 'online_session',
      entityId: String(id),
      beforeData: before,
      afterData: this.serializeOnlineSession(onlineSession),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeOnlineSession(onlineSession) };
  }

  private async findOnlineSessionOrFail(currentUser: CurrentUserContext, id: number) {
    const onlineSession = await this.onlineSessionRepository.findOne({
      where: { id, companyId: currentUser.companyId, deletedAt: IsNull() },
      relations: { person: true, branch: true, shift: true },
    });
    if (!onlineSession) {
      throw new NotFoundException('Online session not found');
    }

    assertBranchAccess(currentUser, onlineSession.branchId, 'Online session not found');
    return onlineSession;
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

  private serializeOnlineSession(onlineSession: OnlineSession) {
    return {
      id: onlineSession.id,
      companyId: onlineSession.companyId,
      branchId: onlineSession.branchId,
      personId: onlineSession.personId,
      shiftId: onlineSession.shiftId,
      label: onlineSession.label,
      platformName: onlineSession.platformName,
      startedAt: onlineSession.startedAt.toISOString(),
      endedAt: onlineSession.endedAt ? onlineSession.endedAt.toISOString() : null,
      durationMinutes: this.calculateDurationMinutes(onlineSession.startedAt, onlineSession.endedAt),
      tokenCount: onlineSession.tokenCount,
      grossAmount: onlineSession.grossAmount === null ? null : String(onlineSession.grossAmount),
      status: onlineSession.status,
      notes: onlineSession.notes,
      personName: `${onlineSession.person.firstName} ${onlineSession.person.lastName}`.trim(),
      personType: onlineSession.person.personType as PersonType,
      shiftTitle: onlineSession.shift?.title ?? null,
      branchName: onlineSession.branch ? `${onlineSession.branch.name} (${onlineSession.branch.code})` : null,
      createdAt: onlineSession.createdAt.toISOString(),
      updatedAt: onlineSession.updatedAt.toISOString(),
      deletedAt: onlineSession.deletedAt ? onlineSession.deletedAt.toISOString() : null,
    };
  }

  private calculateDurationMinutes(startedAt: Date, endedAt: Date | null) {
    if (!endedAt) {
      return null;
    }

    return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));
  }

  private parseDateTime(value: string, label: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${label} is invalid`);
    }
    return parsed;
  }

  private assertDateRange(startedAt: Date, endedAt: Date | null) {
    if (endedAt && endedAt.getTime() < startedAt.getTime()) {
      throw new BadRequestException('Online session end must be greater than or equal to start');
    }
  }

  private parseOnlineSessionStatus(value?: string) {
    if (!value) {
      return OnlineSessionStatus.OPEN;
    }

    if (!Object.values(OnlineSessionStatus).includes(value as OnlineSessionStatus)) {
      throw new BadRequestException('Online session status is invalid');
    }

    return value as OnlineSessionStatus;
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

  private requireBranchId(branchId: number | null) {
    if (branchId === null) {
      throw new BadRequestException('Branch is required for online sessions');
    }
    return branchId;
  }
}
