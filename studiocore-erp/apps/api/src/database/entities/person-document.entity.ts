import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseSoftDeleteEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Company } from './company.entity';
import { RecordStatus } from './enums';
import { Person } from './person.entity';

@Entity('person_documents')
export class PersonDocument extends BaseSoftDeleteEntity {
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

  @Column({ type: 'varchar', length: 120 })
  label!: string;

  @Column({ name: 'legacy_label', type: 'varchar', length: 80, nullable: true })
  legacyLabel!: string | null;

  @Column({ name: 'document_type', type: 'varchar', length: 80 })
  documentType!: string;

  @Column({ name: 'file_type', type: 'varchar', length: 40, nullable: true })
  fileType!: string | null;

  @Column({ name: 'document_number', type: 'varchar', length: 80, nullable: true })
  documentNumber!: string | null;

  @Column({ name: 'storage_bucket', type: 'varchar', length: 120, nullable: true })
  storageBucket!: string | null;

  @Column({ name: 'storage_path', type: 'varchar', length: 500, nullable: true })
  storagePath!: string | null;

  @Column({ name: 'public_url', type: 'varchar', length: 500, nullable: true })
  publicUrl!: string | null;

  @Column({ name: 'issued_at', type: 'date', nullable: true })
  issuedAt!: string | null;

  @Column({ name: 'expires_at', type: 'date', nullable: true })
  expiresAt!: string | null;

  @Column({ type: 'enum', enum: RecordStatus, default: RecordStatus.ACTIVE })
  status!: RecordStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
