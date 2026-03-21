import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseSoftDeleteEntity } from './base.entity';
import { FinancialAccountType } from './enums';

@Entity('financial_accounts')
export class FinancialAccount extends BaseSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'company_id', type: 'int' })
  companyId!: number;

  @Column({ name: 'branch_id', type: 'int', nullable: true })
  branchId!: number | null;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({
    type: 'enum',
    enum: FinancialAccountType,
    default: FinancialAccountType.BANK,
  })
  type!: FinancialAccountType;

  @Column({ type: 'varchar', length: 10, default: 'COP' })
  currency!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance!: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 180, nullable: true })
  bankName!: string | null;

  @Column({ name: 'account_number', type: 'varchar', length: 100, nullable: true })
  accountNumber!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
