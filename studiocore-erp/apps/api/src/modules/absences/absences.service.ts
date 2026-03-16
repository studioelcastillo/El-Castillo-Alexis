import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { assertBranchAccess, resolveBranchFilter, resolveWritableBranchId } from '../../common/utils/tenant-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AbsenceRecordEntity } from '../../database/entities/absence-record.entity';
import { Branch } from '../../database/entities/branch.entity';
import { AbsenceStatus, PersonType } from '../../database/entities/enums';
import { OperationShift } from '../../database/entities/operation-shift.entity';
import { Person } from '../../database/entities/person.entity';
import { AbsencesQueryDto } from './dto/absences-query.dto';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';

type RequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AbsencesService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(AbsenceRecordEntity)
    private readonly absenceRepository: Repository<AbsenceRecordEntity>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(OperationShift)
    private readonly shiftRepository: Repository<OperationShift>,
  ) {}

  async list(currentUser: CurrentUserContext, query: AbsencesQueryDto) {
    const qb = this.absenceRepository.createQueryBuilder('absence');
    qb.leftJoinAndSelect('absence.person', 'person')
      .leftJoinAndSelect('absence.branch', 'branch')
      .leftJoinAndSelect('absence.shift', 'shift')
      .where('absence.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('absence.deleted_at IS NULL');

    const branchId = resolveBranchFilter(currentUser, query.branchId);
    if (branchId !== null) {
      qb.andWhere('absence.branch_id = :branchId', { branchId });
    }

    if (query.personId) {
      qb.andWhere('absence.person_id = :personId', { personId: query.personId });
    }

    if (query.shiftId) {
      qb.andWhere('absence.shift_id = :shiftId', { shiftId: query.shiftId });
    }

    if (query.status) {
      qb.andWhere('absence.status = :status', { status: query.status });
    }

    if (query.from) {
      qb.andWhere('absence.starts_at >= :from', { from: query.from });
    }

    if (query.to) {
      qb.andWhere('absence.starts_at <= :to', { to: query.to });
    }

    if (query.search) {
      qb.andWhere(
        `(
          absence.reason ILIKE :search
          OR absence.notes ILIKE :search
          OR person.first_name ILIKE :search
          OR person.last_name ILIKE :search
          OR shift.title ILIKE :search
        )`,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('absence.startsAt', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items: items.map((item) => this.serializeAbsence(item)), total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(currentUser: CurrentUserContext, id: number) {
    const absence = await this.findAbsenceOrFail(currentUser, id);
    return { data: this.serializeAbsence(absence) };
  }

  async create(currentUser: CurrentUserContext, dto: CreateAbsenceDto, requestMeta?: RequestMeta) {
    const branchId = this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId));
    const branch = await this.ensureBranch(currentUser.companyId, branchId);
    const person = await this.ensurePerson(currentUser.companyId, branchId, dto.personId);
    const shift = await this.resolveShift(currentUser.companyId, branchId, person.id, dto.shiftId ?? null);
    const startsAt = this.parseDateTime(dto.startsAt, 'Absence start');
    const endsAt = dto.endsAt ? this.parseDateTime(dto.endsAt, 'Absence end') : null;
    this.assertDateRange(startsAt, endsAt);

    const absence = await this.absenceRepository.save(
      this.absenceRepository.create({
        companyId: currentUser.companyId,
        branchId,
        personId: person.id,
        shiftId: shift?.id ?? null,
        startsAt,
        endsAt,
        reason: dto.reason.trim(),
        status: this.parseAbsenceStatus(dto.status),
        supportUrl: this.normalizeString(dto.supportUrl),
        notes: this.normalizeString(dto.notes),
      }),
    );

    const created = await this.absenceRepository.findOneOrFail({ where: { id: absence.id }, relations: { person: true, branch: true, shift: true } });

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'absences',
      action: 'create',
      entityType: 'absence_record',
      entityId: String(created.id),
      afterData: this.serializeAbsence(created),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeAbsence(created) };
  }

  async update(currentUser: CurrentUserContext, id: number, dto: UpdateAbsenceDto, requestMeta?: RequestMeta) {
    const existing = await this.findAbsenceOrFail(currentUser, id);
    const nextBranchId = dto.branchId !== undefined ? this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId)) : existing.branchId;
    const branch = await this.ensureBranch(currentUser.companyId, nextBranchId);
    const nextPersonId = dto.personId !== undefined ? dto.personId : existing.personId;
    const person = await this.ensurePerson(currentUser.companyId, nextBranchId, nextPersonId);
    const nextShiftId = dto.shiftId !== undefined ? dto.shiftId ?? null : existing.shiftId;
    await this.resolveShift(currentUser.companyId, nextBranchId, person.id, nextShiftId);
    const startsAt = dto.startsAt !== undefined ? this.parseDateTime(dto.startsAt, 'Absence start') : existing.startsAt;
    const endsAt = dto.endsAt !== undefined ? (dto.endsAt ? this.parseDateTime(dto.endsAt, 'Absence end') : null) : existing.endsAt;
    this.assertDateRange(startsAt, endsAt);
    const before = this.serializeAbsence(existing);

    await this.absenceRepository.update(
      { id },
      {
        ...(dto.branchId !== undefined ? { branchId: nextBranchId } : {}),
        ...(dto.personId !== undefined ? { personId: dto.personId } : {}),
        ...(dto.shiftId !== undefined ? { shiftId: dto.shiftId ?? null } : {}),
        ...(dto.startsAt !== undefined ? { startsAt } : {}),
        ...(dto.endsAt !== undefined ? { endsAt } : {}),
        ...(dto.reason !== undefined ? { reason: dto.reason.trim() } : {}),
        ...(dto.status !== undefined ? { status: this.parseAbsenceStatus(dto.status) } : {}),
        ...(dto.supportUrl !== undefined ? { supportUrl: this.normalizeString(dto.supportUrl) } : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeString(dto.notes) } : {}),
      },
    );

    const absence = await this.findAbsenceOrFail(currentUser, id);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'absences',
      action: 'edit',
      entityType: 'absence_record',
      entityId: String(id),
      beforeData: before,
      afterData: this.serializeAbsence(absence),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeAbsence(absence) };
  }

  private async findAbsenceOrFail(currentUser: CurrentUserContext, id: number) {
    const absence = await this.absenceRepository.findOne({
      where: { id, companyId: currentUser.companyId, deletedAt: IsNull() },
      relations: { person: true, branch: true, shift: true },
    });
    if (!absence) {
      throw new NotFoundException('Absence record not found');
    }

    assertBranchAccess(currentUser, absence.branchId, 'Absence record not found');
    return absence;
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

  private serializeAbsence(absence: AbsenceRecordEntity) {
    return {
      id: absence.id,
      companyId: absence.companyId,
      branchId: absence.branchId,
      personId: absence.personId,
      shiftId: absence.shiftId,
      startsAt: absence.startsAt.toISOString(),
      endsAt: absence.endsAt ? absence.endsAt.toISOString() : null,
      reason: absence.reason,
      status: absence.status,
      supportUrl: absence.supportUrl,
      notes: absence.notes,
      personName: `${absence.person.firstName} ${absence.person.lastName}`.trim(),
      personType: absence.person.personType as PersonType,
      shiftTitle: absence.shift?.title ?? null,
      branchName: absence.branch ? `${absence.branch.name} (${absence.branch.code})` : null,
      createdAt: absence.createdAt.toISOString(),
      updatedAt: absence.updatedAt.toISOString(),
      deletedAt: absence.deletedAt ? absence.deletedAt.toISOString() : null,
    };
  }

  private parseDateTime(value: string, label: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${label} is invalid`);
    }
    return parsed;
  }

  private assertDateRange(startsAt: Date, endsAt: Date | null) {
    if (endsAt && endsAt.getTime() < startsAt.getTime()) {
      throw new BadRequestException('Absence end must be greater than or equal to start');
    }
  }

  private parseAbsenceStatus(value?: string) {
    if (!value) {
      return AbsenceStatus.REPORTED;
    }

    if (!Object.values(AbsenceStatus).includes(value as AbsenceStatus)) {
      throw new BadRequestException('Absence status is invalid');
    }

    return value as AbsenceStatus;
  }

  private normalizeString(value: string | null | undefined) {
    const normalized = (value || '').trim();
    return normalized || null;
  }

  private requireBranchId(branchId: number | null) {
    if (branchId === null) {
      throw new BadRequestException('Branch is required for absences');
    }
    return branchId;
  }
}
