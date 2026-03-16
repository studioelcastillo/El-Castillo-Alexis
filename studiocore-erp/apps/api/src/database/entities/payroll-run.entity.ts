import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditedEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Company } from './company.entity';
import { PayrollPeriod } from './payroll-period.entity';

@Entity('payroll_runs')
export class PayrollRun extends BaseAuditedEntity {
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

  @Column({ name: 'period_id', type: 'int' })
  periodId!: number;

  @ManyToOne(() => PayrollPeriod, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'period_id' })
  period!: PayrollPeriod;

  @Column({ name: 'run_number', type: 'int' })
  runNumber!: number;

  @Column({ type: 'jsonb' })
  totals!: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  items!: Array<Record<string, unknown>>;
}
