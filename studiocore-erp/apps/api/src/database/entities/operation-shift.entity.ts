import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseSoftDeleteEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Company } from './company.entity';
import { OperationShiftStatus } from './enums';
import { Person } from './person.entity';

@Entity('operation_shifts')
export class OperationShift extends BaseSoftDeleteEntity {
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

  @Column({ type: 'varchar', length: 150 })
  title!: string;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt!: Date;

  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt!: Date;

  @Column({ name: 'platform_name', type: 'varchar', length: 120, nullable: true })
  platformName!: string | null;

  @Column({ name: 'room_label', type: 'varchar', length: 120, nullable: true })
  roomLabel!: string | null;

  @Column({ name: 'goal_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  goalAmount!: string | null;

  @Column({ type: 'enum', enum: OperationShiftStatus, default: OperationShiftStatus.SCHEDULED })
  status!: OperationShiftStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
