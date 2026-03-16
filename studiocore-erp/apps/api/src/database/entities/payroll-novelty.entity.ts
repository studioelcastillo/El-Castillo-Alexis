import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseSoftDeleteEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Company } from './company.entity';
import { PayrollNoveltyStatus, PayrollNoveltyType } from './enums';
import { PayrollPeriod } from './payroll-period.entity';
import { Person } from './person.entity';

@Entity('payroll_novelties')
export class PayrollNovelty extends BaseSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'period_id', type: 'int' })
  periodId!: number;

  @ManyToOne(() => PayrollPeriod, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'period_id' })
  period!: PayrollPeriod;

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

  @Column({ name: 'novelty_type', type: 'enum', enum: PayrollNoveltyType })
  noveltyType!: PayrollNoveltyType;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: string;

  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate!: string;

  @Column({ type: 'enum', enum: PayrollNoveltyStatus, default: PayrollNoveltyStatus.PENDING })
  status!: PayrollNoveltyStatus;

  @Column({ name: 'is_critical', type: 'boolean', default: false })
  isCritical!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
