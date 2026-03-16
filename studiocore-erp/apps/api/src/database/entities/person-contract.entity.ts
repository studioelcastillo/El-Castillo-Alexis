import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseSoftDeleteEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Company } from './company.entity';
import { Person } from './person.entity';

@Entity('person_contracts')
export class PersonContract extends BaseSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'person_id', type: 'int' })
  personId!: number;

  @ManyToOne(() => Person, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'person_id' })
  person!: Person;

  @Column({ name: 'company_id', type: 'int' })
  companyId!: number;

  @ManyToOne(() => Company, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column({ name: 'branch_id', type: 'int', nullable: true })
  branchId!: number | null;

  @ManyToOne(() => Branch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch | null;

  @Column({ name: 'contract_type', type: 'varchar', length: 80 })
  contractType!: string;

  @Column({ name: 'contract_number', type: 'varchar', length: 80, nullable: true })
  contractNumber!: string | null;

  @Column({ name: 'commission_type', type: 'varchar', length: 30, nullable: true })
  commissionType!: string | null;

  @Column({ name: 'commission_percent', type: 'numeric', precision: 10, scale: 2, nullable: true })
  commissionPercent!: string | null;

  @Column({ name: 'goal_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  goalAmount!: string | null;

  @Column({ name: 'position_name', type: 'varchar', length: 120, nullable: true })
  positionName!: string | null;

  @Column({ name: 'area_name', type: 'varchar', length: 120, nullable: true })
  areaName!: string | null;

  @Column({ name: 'city_name', type: 'varchar', length: 120, nullable: true })
  cityName!: string | null;

  @Column({ name: 'starts_at', type: 'date' })
  startsAt!: string;

  @Column({ name: 'ends_at', type: 'date', nullable: true })
  endsAt!: string | null;

  @Column({ name: 'monthly_salary', type: 'numeric', precision: 14, scale: 2, nullable: true })
  monthlySalary!: string | null;

  @Column({ name: 'biweekly_salary', type: 'numeric', precision: 14, scale: 2, nullable: true })
  biweeklySalary!: string | null;

  @Column({ name: 'daily_salary', type: 'numeric', precision: 14, scale: 2, nullable: true })
  dailySalary!: string | null;

  @Column({ name: 'uniform_amount', type: 'numeric', precision: 14, scale: 2, nullable: true })
  uniformAmount!: string | null;

  @Column({ name: 'has_withholding', type: 'boolean', default: false })
  hasWithholding!: boolean;

  @Column({ name: 'has_sena', type: 'boolean', default: false })
  hasSena!: boolean;

  @Column({ name: 'has_compensation_box', type: 'boolean', default: false })
  hasCompensationBox!: boolean;

  @Column({ name: 'has_icbf', type: 'boolean', default: false })
  hasIcbf!: boolean;

  @Column({ name: 'arl_risk_level', type: 'varchar', length: 5, nullable: true })
  arlRiskLevel!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
