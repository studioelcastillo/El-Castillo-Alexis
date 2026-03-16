import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseSoftDeleteEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Company } from './company.entity';
import { OnlineSessionStatus } from './enums';
import { OperationShift } from './operation-shift.entity';
import { Person } from './person.entity';

@Entity('online_sessions')
export class OnlineSession extends BaseSoftDeleteEntity {
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

  @Column({ type: 'varchar', length: 180 })
  label!: string;

  @Column({ name: 'platform_name', type: 'varchar', length: 120, nullable: true })
  platformName!: string | null;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt!: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt!: Date | null;

  @Column({ name: 'token_count', type: 'int', nullable: true })
  tokenCount!: number | null;

  @Column({ name: 'gross_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  grossAmount!: string | null;

  @Column({ type: 'enum', enum: OnlineSessionStatus, default: OnlineSessionStatus.OPEN })
  status!: OnlineSessionStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
