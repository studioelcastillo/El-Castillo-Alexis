import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { assertBranchAccess, resolveBranchFilter, resolveWritableBranchId } from '../../common/utils/tenant-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Branch } from '../../database/entities/branch.entity';
import { OperationShiftStatus, PersonType } from '../../database/entities/enums';
import { OperationShift } from '../../database/entities/operation-shift.entity';
import { Person } from '../../database/entities/person.entity';
import { CreateOperationShiftDto } from './dto/create-operation-shift.dto';
import { OperationShiftsQueryDto } from './dto/operation-shifts-query.dto';
import { UpdateOperationShiftDto } from './dto/update-operation-shift.dto';

type RequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class OperationsService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(OperationShift)
    private readonly shiftRepository: Repository<OperationShift>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  async list(currentUser: CurrentUserContext, query: OperationShiftsQueryDto) {
    const qb = this.shiftRepository.createQueryBuilder('shift');
    qb.leftJoinAndSelect('shift.person', 'person')
      .leftJoinAndSelect('shift.branch', 'branch')
      .where('shift.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('shift.deleted_at IS NULL');

    const branchId = resolveBranchFilter(currentUser, query.branchId);
    if (branchId !== null) {
      qb.andWhere('shift.branch_id = :branchId', { branchId });
    }

    if (query.personId) {
      qb.andWhere('shift.person_id = :personId', { personId: query.personId });
    }

    if (query.status) {
      qb.andWhere('shift.status = :status', { status: query.status });
    }

    if (query.from) {
      qb.andWhere('shift.starts_at >= :from', { from: query.from });
    }

    if (query.to) {
      qb.andWhere('shift.ends_at <= :to', { to: query.to });
    }

    if (query.search) {
      qb.andWhere(
        `(
          shift.title ILIKE :search
          OR shift.platform_name ILIKE :search
          OR shift.room_label ILIKE :search
          OR person.first_name ILIKE :search
          OR person.last_name ILIKE :search
        )`,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('shift.startsAt', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((item) => this.serializeShift(item)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findOne(currentUser: CurrentUserContext, id: number) {
    const shift = await this.findShiftOrFail(currentUser, id);
    return { data: this.serializeShift(shift) };
  }

  async create(currentUser: CurrentUserContext, dto: CreateOperationShiftDto, requestMeta?: RequestMeta) {
    const branchId = this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId));
    const branch = await this.ensureBranch(currentUser.companyId, branchId);
    const person = await this.ensurePerson(currentUser.companyId, branchId, dto.personId);
    const startsAt = this.parseDateTime(dto.startsAt, 'Shift start');
    const endsAt = this.parseDateTime(dto.endsAt, 'Shift end');
    this.assertDateRange(startsAt, endsAt);
    const status = this.parseShiftStatus(dto.status);

    const shift = await this.shiftRepository.save(
      this.shiftRepository.create({
        companyId: currentUser.companyId,
        branchId,
        personId: person.id,
        title: dto.title.trim(),
        startsAt,
        endsAt,
        platformName: this.normalizeString(dto.platformName),
        roomLabel: this.normalizeString(dto.roomLabel),
        goalAmount: this.normalizeString(dto.goalAmount),
        status,
        notes: this.normalizeString(dto.notes),
      }),
    );

    const createdShift = await this.shiftRepository.findOneOrFail({
      where: { id: shift.id },
      relations: { person: true, branch: true },
    });

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'operations',
      action: 'create',
      entityType: 'operation_shift',
      entityId: String(createdShift.id),
      afterData: this.serializeShift(createdShift),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeShift(createdShift) };
  }

  async update(currentUser: CurrentUserContext, id: number, dto: UpdateOperationShiftDto, requestMeta?: RequestMeta) {
    const existing = await this.findShiftOrFail(currentUser, id);
    const nextBranchId = dto.branchId !== undefined
      ? this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId))
      : existing.branchId;
    const branch = await this.ensureBranch(currentUser.companyId, nextBranchId);
    const nextPersonId = dto.personId !== undefined ? dto.personId : existing.personId;
    await this.ensurePerson(currentUser.companyId, nextBranchId, nextPersonId);
    const startsAt = dto.startsAt !== undefined ? this.parseDateTime(dto.startsAt, 'Shift start') : existing.startsAt;
    const endsAt = dto.endsAt !== undefined ? this.parseDateTime(dto.endsAt, 'Shift end') : existing.endsAt;
    this.assertDateRange(startsAt, endsAt);
    const before = this.serializeShift(existing);

    await this.shiftRepository.update(
      { id },
      {
        ...(dto.branchId !== undefined ? { branchId: nextBranchId } : {}),
        ...(dto.personId !== undefined ? { personId: dto.personId } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.startsAt !== undefined ? { startsAt } : {}),
        ...(dto.endsAt !== undefined ? { endsAt } : {}),
        ...(dto.platformName !== undefined ? { platformName: this.normalizeString(dto.platformName) } : {}),
        ...(dto.roomLabel !== undefined ? { roomLabel: this.normalizeString(dto.roomLabel) } : {}),
        ...(dto.goalAmount !== undefined ? { goalAmount: this.normalizeString(dto.goalAmount) } : {}),
        ...(dto.status !== undefined ? { status: this.parseShiftStatus(dto.status) } : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeString(dto.notes) } : {}),
      },
    );

    const shift = await this.findShiftOrFail(currentUser, id);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'operations',
      action: 'edit',
      entityType: 'operation_shift',
      entityId: String(id),
      beforeData: before,
      afterData: this.serializeShift(shift),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeShift(shift) };
  }

  private async findShiftOrFail(currentUser: CurrentUserContext, id: number) {
    const shift = await this.shiftRepository.findOne({
      where: { id, companyId: currentUser.companyId, deletedAt: IsNull() },
      relations: { person: true, branch: true },
    });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    assertBranchAccess(currentUser, shift.branchId, 'Shift not found');
    return shift;
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

  private serializeShift(shift: OperationShift) {
    return {
      id: shift.id,
      companyId: shift.companyId,
      branchId: shift.branchId,
      personId: shift.personId,
      title: shift.title,
      startsAt: shift.startsAt.toISOString(),
      endsAt: shift.endsAt.toISOString(),
      platformName: shift.platformName,
      roomLabel: shift.roomLabel,
      goalAmount: shift.goalAmount === null ? null : String(shift.goalAmount),
      status: shift.status,
      notes: shift.notes,
      personName: `${shift.person.firstName} ${shift.person.lastName}`.trim(),
      personType: shift.person.personType as PersonType,
      branchName: shift.branch ? `${shift.branch.name} (${shift.branch.code})` : null,
      createdAt: shift.createdAt.toISOString(),
      updatedAt: shift.updatedAt.toISOString(),
      deletedAt: shift.deletedAt ? shift.deletedAt.toISOString() : null,
    };
  }

  private parseDateTime(value: string, label: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${label} is invalid`);
    }
    return parsed;
  }

  private assertDateRange(startsAt: Date, endsAt: Date) {
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException('Shift end must be greater than shift start');
    }
  }

  private parseShiftStatus(value?: string) {
    if (!value) {
      return OperationShiftStatus.SCHEDULED;
    }

    if (!Object.values(OperationShiftStatus).includes(value as OperationShiftStatus)) {
      throw new BadRequestException('Shift status is invalid');
    }

    return value as OperationShiftStatus;
  }

  private normalizeString(value: string | null | undefined) {
    const normalized = (value || '').trim();
    return normalized || null;
  }

  private requireBranchId(branchId: number | null) {
    if (branchId === null) {
      throw new BadRequestException('Branch is required for shifts');
    }
    return branchId;
  }
}
