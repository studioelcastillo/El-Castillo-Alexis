import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditedEntity } from './base.entity';
import { FinancialTransactionType } from './enums';

@Entity('financial_transactions')
export class FinancialTransaction extends BaseAuditedEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'company_id' })
  companyId!: number;

  @Column({ name: 'branch_id', nullable: true })
  branchId!: number | null;

  @Column({ name: 'account_id' })
  accountId!: number;

  @Column({
    type: 'enum',
    enum: FinancialTransactionType,
  })
  type!: FinancialTransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: string;

  @Column({ name: 'transaction_date', type: 'timestamptz' })
  transactionDate!: Date;

  @Column()
  description!: string;

  @Column({ name: 'person_id', nullable: true })
  personId!: number | null;

  @Column({ name: 'related_entity_type', nullable: true })
  relatedEntityType!: string | null;

  @Column({ name: 'related_entity_id', nullable: true })
  relatedEntityId!: string | null;

  @Column({ name: 'created_by_id' })
  createdById!: number;
}
