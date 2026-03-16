import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseSoftDeleteEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Company } from './company.entity';
import { HrDisciplinaryActionType, HrRequestStatus } from './enums';
import { PayrollNovelty } from './payroll-novelty.entity';
import { Person } from './person.entity';

@Entity('hr_disciplinary_actions')
export class HrDisciplinaryAction extends BaseSoftDeleteEntity {
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

  @Column({ name: 'action_type', type: 'enum', enum: HrDisciplinaryActionType })
  actionType!: HrDisciplinaryActionType;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate!: string;

  @Column({ name: 'support_url', type: 'varchar', length: 500, nullable: true })
  supportUrl!: string | null;

  @Column({ name: 'payroll_impact_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  payrollImpactAmount!: string | null;

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
