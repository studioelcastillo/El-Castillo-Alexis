import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseSoftDeleteEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Company } from './company.entity';
import { HrRequestStatus } from './enums';
import { PayrollNovelty } from './payroll-novelty.entity';
import { Person } from './person.entity';

@Entity('hr_vacations')
export class HrVacation extends BaseSoftDeleteEntity {
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

  @Column({ type: 'varchar', length: 180 })
  reason!: string;

  @Column({ name: 'starts_at', type: 'date' })
  startsAt!: string;

  @Column({ name: 'ends_at', type: 'date' })
  endsAt!: string;

  @Column({ name: 'is_paid', type: 'boolean', default: true })
  isPaid!: boolean;

  @Column({ type: 'enum', enum: HrRequestStatus, default: HrRequestStatus.REQUESTED })
  status!: HrRequestStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'payroll_novelty_id', type: 'int', nullable: true })
  payrollNoveltyId!: number | null;

  @ManyToOne(() => PayrollNovelty, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'payroll_novelty_id' })
  payrollNovelty!: PayrollNovelty | null;
}
