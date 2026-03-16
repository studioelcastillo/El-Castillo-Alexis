import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseSoftDeleteEntity } from './base.entity';
import { FinancialAccountType } from './enums';

@Entity('financial_accounts')
export class FinancialAccount extends BaseSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'company_id' })
  companyId!: number;

  @Column({ name: 'branch_id', nullable: true })
  branchId!: number | null;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: FinancialAccountType,
    default: FinancialAccountType.BANK,
  })
  type!: FinancialAccountType;

  @Column({ default: 'COP' })
  currency!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance!: string;

  @Column({ nullable: true })
  bankName!: string;

  @Column({ nullable: true })
  accountNumber!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
