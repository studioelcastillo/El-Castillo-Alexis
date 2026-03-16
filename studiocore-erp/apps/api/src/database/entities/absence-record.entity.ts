import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseSoftDeleteEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Company } from './company.entity';
import { AbsenceStatus } from './enums';
import { OperationShift } from './operation-shift.entity';
import { Person } from './person.entity';

@Entity('absence_records')
export class AbsenceRecordEntity extends BaseSoftDeleteEntity {
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

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt!: Date;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt!: Date | null;

  @Column({ type: 'varchar', length: 180 })
  reason!: string;

  @Column({ type: 'enum', enum: AbsenceStatus, default: AbsenceStatus.REPORTED })
  status!: AbsenceStatus;

  @Column({ name: 'support_url', type: 'varchar', length: 500, nullable: true })
  supportUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
