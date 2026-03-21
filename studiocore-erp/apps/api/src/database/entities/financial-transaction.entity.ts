import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditedEntity } from './base.entity';
import { FinancialTransactionStatus, FinancialTransactionType } from './enums';

@Entity('financial_transactions')
export class FinancialTransaction extends BaseAuditedEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'company_id', type: 'int' })
  companyId!: number;

  @Column({ name: 'branch_id', type: 'int', nullable: true })
  branchId!: number | null;

  @Column({ name: 'account_id', type: 'int' })
  accountId!: number;

  @Column({
    type: 'enum',
    enum: FinancialTransactionType,
  })
  type!: FinancialTransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: string;

  @Column({
    type: 'enum',
    enum: FinancialTransactionStatus,
    default: FinancialTransactionStatus.POSTED,
  })
  status!: FinancialTransactionStatus;

  @Column({ name: 'transaction_date', type: 'timestamptz' })
  transactionDate!: Date;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'person_id', type: 'int', nullable: true })
  personId!: number | null;

  @Column({ name: 'related_entity_type', type: 'varchar', length: 100, nullable: true })
  relatedEntityType!: string | null;

  @Column({ name: 'related_entity_id', type: 'varchar', length: 100, nullable: true })
  relatedEntityId!: string | null;

  @Column({ name: 'created_by_id', type: 'int' })
  createdById!: number;

  @Column({ name: 'void_reason', type: 'text', nullable: true })
  voidReason!: string | null;

  @Column({ name: 'voided_at', type: 'timestamptz', nullable: true })
  voidedAt!: Date | null;

  @Column({ name: 'voided_by_id', type: 'int', nullable: true })
  voidedById!: number | null;
}
