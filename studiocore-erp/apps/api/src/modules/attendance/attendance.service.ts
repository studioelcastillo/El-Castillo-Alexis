import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { assertBranchAccess, resolveBranchFilter, resolveWritableBranchId } from '../../common/utils/tenant-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AttendanceRecordEntity } from '../../database/entities/attendance-record.entity';
import { Branch } from '../../database/entities/branch.entity';
import { AttendanceStatus, PersonType } from '../../database/entities/enums';
import { OperationShift } from '../../database/entities/operation-shift.entity';
import { Person } from '../../database/entities/person.entity';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

type RequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AttendanceService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(AttendanceRecordEntity)
    private readonly attendanceRepository: Repository<AttendanceRecordEntity>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(OperationShift)
    private readonly shiftRepository: Repository<OperationShift>,
  ) {}

  async list(currentUser: CurrentUserContext, query: AttendanceQueryDto) {
    const qb = this.attendanceRepository.createQueryBuilder('attendance');
    qb.leftJoinAndSelect('attendance.person', 'person')
      .leftJoinAndSelect('attendance.branch', 'branch')
      .leftJoinAndSelect('attendance.shift', 'shift')
      .where('attendance.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('attendance.deleted_at IS NULL');

    const branchId = resolveBranchFilter(currentUser, query.branchId);
    if (branchId !== null) {
      qb.andWhere('attendance.branch_id = :branchId', { branchId });
    }

    if (query.personId) {
      qb.andWhere('attendance.person_id = :personId', { personId: query.personId });
    }

    if (query.shiftId) {
      qb.andWhere('attendance.shift_id = :shiftId', { shiftId: query.shiftId });
    }

    if (query.status) {
      qb.andWhere('attendance.status = :status', { status: query.status });
    }

    if (query.from) {
      qb.andWhere('attendance.attendance_date >= :from', { from: query.from });
    }

    if (query.to) {
      qb.andWhere('attendance.attendance_date <= :to', { to: query.to });
    }

    if (query.search) {
      qb.andWhere(
        `(
          person.first_name ILIKE :search
          OR person.last_name ILIKE :search
          OR shift.title ILIKE :search
          OR attendance.notes ILIKE :search
        )`,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('attendance.attendanceDate', 'DESC')
      .addOrderBy('attendance.createdAt', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((item) => this.serializeAttendance(item)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findOne(currentUser: CurrentUserContext, id: number) {
    const attendance = await this.findAttendanceOrFail(currentUser, id);
    return { data: this.serializeAttendance(attendance) };
  }

  async create(currentUser: CurrentUserContext, dto: CreateAttendanceDto, requestMeta?: RequestMeta) {
    const branchId = this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId));
    const branch = await this.ensureBranch(currentUser.companyId, branchId);
    const person = await this.ensurePerson(currentUser.companyId, branchId, dto.personId);
    const shift = await this.resolveShift(currentUser.companyId, branchId, person.id, dto.shiftId ?? null);
    const status = this.parseAttendanceStatus(dto.status);
    const checkInAt = dto.checkInAt ? this.parseDateTime(dto.checkInAt, 'Check-in') : null;
    const checkOutAt = dto.checkOutAt ? this.parseDateTime(dto.checkOutAt, 'Check-out') : null;
    this.assertCheckTimes(checkInAt, checkOutAt);

    const attendance = await this.attendanceRepository.save(
      this.attendanceRepository.create({
        companyId: currentUser.companyId,
        branchId,
        personId: person.id,
        shiftId: shift?.id ?? null,
        attendanceDate: dto.attendanceDate,
        status,
        checkInAt,
        checkOutAt,
        notes: this.normalizeString(dto.notes),
      }),
    );

    const created = await this.attendanceRepository.findOneOrFail({
      where: { id: attendance.id },
      relations: { person: true, branch: true, shift: true },
    });

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'attendance',
      action: 'create',
      entityType: 'attendance_record',
      entityId: String(created.id),
      afterData: this.serializeAttendance(created),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeAttendance(created) };
  }

  async update(currentUser: CurrentUserContext, id: number, dto: UpdateAttendanceDto, requestMeta?: RequestMeta) {
    const existing = await this.findAttendanceOrFail(currentUser, id);
    const nextBranchId = dto.branchId !== undefined
      ? this.requireBranchId(resolveWritableBranchId(currentUser, dto.branchId))
      : existing.branchId;
    const branch = await this.ensureBranch(currentUser.companyId, nextBranchId);
    const nextPersonId = dto.personId !== undefined ? dto.personId : existing.personId;
    const person = await this.ensurePerson(currentUser.companyId, nextBranchId, nextPersonId);
    const nextShiftId = dto.shiftId !== undefined ? dto.shiftId ?? null : existing.shiftId;
    await this.resolveShift(currentUser.companyId, nextBranchId, person.id, nextShiftId);
    const checkInAt = dto.checkInAt !== undefined ? (dto.checkInAt ? this.parseDateTime(dto.checkInAt, 'Check-in') : null) : existing.checkInAt;
    const checkOutAt = dto.checkOutAt !== undefined ? (dto.checkOutAt ? this.parseDateTime(dto.checkOutAt, 'Check-out') : null) : existing.checkOutAt;
    this.assertCheckTimes(checkInAt, checkOutAt);
    const before = this.serializeAttendance(existing);

    await this.attendanceRepository.update(
      { id },
      {
        ...(dto.branchId !== undefined ? { branchId: nextBranchId } : {}),
        ...(dto.personId !== undefined ? { personId: dto.personId } : {}),
        ...(dto.shiftId !== undefined ? { shiftId: dto.shiftId ?? null } : {}),
        ...(dto.attendanceDate !== undefined ? { attendanceDate: dto.attendanceDate } : {}),
        ...(dto.status !== undefined ? { status: this.parseAttendanceStatus(dto.status) } : {}),
        ...(dto.checkInAt !== undefined ? { checkInAt } : {}),
        ...(dto.checkOutAt !== undefined ? { checkOutAt } : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeString(dto.notes) } : {}),
      },
    );

    const attendance = await this.findAttendanceOrFail(currentUser, id);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branch.id,
      userId: currentUser.id,
      module: 'attendance',
      action: 'edit',
      entityType: 'attendance_record',
      entityId: String(id),
      beforeData: before,
      afterData: this.serializeAttendance(attendance),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeAttendance(attendance) };
  }

  private async findAttendanceOrFail(currentUser: CurrentUserContext, id: number) {
    const attendance = await this.attendanceRepository.findOne({
      where: { id, companyId: currentUser.companyId, deletedAt: IsNull() },
      relations: { person: true, branch: true, shift: true },
    });
    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    assertBranchAccess(currentUser, attendance.branchId, 'Attendance record not found');
    return attendance;
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

  private serializeAttendance(attendance: AttendanceRecordEntity) {
    return {
      id: attendance.id,
      companyId: attendance.companyId,
      branchId: attendance.branchId,
      personId: attendance.personId,
      shiftId: attendance.shiftId,
      attendanceDate: attendance.attendanceDate,
      status: attendance.status,
      checkInAt: attendance.checkInAt ? attendance.checkInAt.toISOString() : null,
      checkOutAt: attendance.checkOutAt ? attendance.checkOutAt.toISOString() : null,
      notes: attendance.notes,
      personName: `${attendance.person.firstName} ${attendance.person.lastName}`.trim(),
      personType: attendance.person.personType as PersonType,
      shiftTitle: attendance.shift?.title ?? null,
      branchName: attendance.branch ? `${attendance.branch.name} (${attendance.branch.code})` : null,
      createdAt: attendance.createdAt.toISOString(),
      updatedAt: attendance.updatedAt.toISOString(),
      deletedAt: attendance.deletedAt ? attendance.deletedAt.toISOString() : null,
    };
  }

  private parseAttendanceStatus(value?: string) {
    if (!value) {
      return AttendanceStatus.PRESENT;
    }

    if (!Object.values(AttendanceStatus).includes(value as AttendanceStatus)) {
      throw new BadRequestException('Attendance status is invalid');
    }

    return value as AttendanceStatus;
  }

  private parseDateTime(value: string, label: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${label} is invalid`);
    }
    return parsed;
  }

  private assertCheckTimes(checkInAt: Date | null, checkOutAt: Date | null) {
    if (checkInAt && checkOutAt && checkOutAt.getTime() < checkInAt.getTime()) {
      throw new BadRequestException('Check-out must be greater than or equal to check-in');
    }
  }

  private normalizeString(value: string | null | undefined) {
    const normalized = (value || '').trim();
    return normalized || null;
  }

  private requireBranchId(branchId: number | null) {
    if (branchId === null) {
      throw new BadRequestException('Branch is required for attendance');
    }
    return branchId;
  }
}
