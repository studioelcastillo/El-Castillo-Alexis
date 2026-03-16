import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BaseSoftDeleteEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Company } from './company.entity';
import { PayrollPeriodStatus } from './enums';
import { PayrollRun } from './payroll-run.entity';

@Entity('payroll_periods')
@Unique('uq_payroll_periods_company_branch_code', ['companyId', 'branchId', 'code'])
export class PayrollPeriod extends BaseSoftDeleteEntity {
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

  @Column({ type: 'varchar', length: 80 })
  code!: string;

  @Column({ type: 'varchar', length: 180 })
  label!: string;

  @Column({ name: 'period_start', type: 'date' })
  periodStart!: string;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd!: string;

  @Column({ type: 'enum', enum: PayrollPeriodStatus, default: PayrollPeriodStatus.DRAFT })
  status!: PayrollPeriodStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'last_calculated_at', type: 'timestamptz', nullable: true })
  lastCalculatedAt!: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @OneToMany(() => PayrollRun, (run) => run.period)
  runs!: PayrollRun[];
}
