import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseSoftDeleteEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Company } from './company.entity';
import { GoalStatus } from './enums';
import { OperationShift } from './operation-shift.entity';
import { Person } from './person.entity';

@Entity('goal_records')
export class GoalRecordEntity extends BaseSoftDeleteEntity {
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
  title!: string;

  @Column({ name: 'period_start', type: 'date' })
  periodStart!: string;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd!: string;

  @Column({ name: 'target_amount', type: 'numeric', precision: 12, scale: 2 })
  targetAmount!: string;

  @Column({ name: 'achieved_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  achievedAmount!: string | null;

  @Column({ name: 'bonus_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  bonusAmount!: string | null;

  @Column({ type: 'enum', enum: GoalStatus, default: GoalStatus.DRAFT })
  status!: GoalStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
