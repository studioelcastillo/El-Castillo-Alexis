import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseSoftDeleteEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Company } from './company.entity';
import { AttendanceStatus } from './enums';
import { OperationShift } from './operation-shift.entity';
import { Person } from './person.entity';

@Entity('attendance_records')
export class AttendanceRecordEntity extends BaseSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'company_id', type: 'int' })
  companyId!: number;

  @ManyToOne(() => Company, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column({ name: 'branch_id', type: 'int' })
  branchId!: number;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ name: 'person_id', type: 'int' })
  personId!: number;

  @ManyToOne(() => Person, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'person_id' })
  person!: Person;

  @Column({ name: 'shift_id', type: 'int', nullable: true })
  shiftId!: number | null;

  @ManyToOne(() => OperationShift, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'shift_id' })
  shift!: OperationShift | null;

  @Column({ name: 'attendance_date', type: 'date' })
  attendanceDate!: string;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  status!: AttendanceStatus;

  @Column({ name: 'check_in_at', type: 'timestamptz', nullable: true })
  checkInAt!: Date | null;

  @Column({ name: 'check_out_at', type: 'timestamptz', nullable: true })
  checkOutAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
