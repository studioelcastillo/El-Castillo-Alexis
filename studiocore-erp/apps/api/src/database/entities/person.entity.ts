import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseSoftDeleteEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Company } from './company.entity';
import { PersonType, RecordStatus } from './enums';

@Entity('people')
export class Person extends BaseSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id!: number;

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

  @Column({ name: 'person_type', type: 'enum', enum: PersonType, default: PersonType.STAFF })
  personType!: PersonType;

  @Column({ name: 'first_name', type: 'varchar', length: 120 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 120 })
  lastName!: string;

  @Column({ name: 'document_type', type: 'varchar', length: 50, nullable: true })
  documentType!: string | null;

  @Column({ name: 'document_number', type: 'varchar', length: 80, nullable: true })
  documentNumber!: string | null;

  @Column({ name: 'issued_in', type: 'varchar', length: 120, nullable: true })
  issuedIn!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email!: string | null;

  @Column({ name: 'personal_email', type: 'varchar', length: 150, nullable: true })
  personalEmail!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 220, nullable: true })
  address!: string | null;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  sex!: string | null;

  @Column({ name: 'blood_type', type: 'varchar', length: 10, nullable: true })
  bloodType!: string | null;

  @Column({ name: 'model_category', type: 'varchar', length: 40, nullable: true })
  modelCategory!: string | null;

  @Column({ name: 'photo_url', type: 'varchar', length: 500, nullable: true })
  photoUrl!: string | null;

  @Column({ name: 'bank_entity', type: 'varchar', length: 120, nullable: true })
  bankEntity!: string | null;

  @Column({ name: 'bank_account_type', type: 'varchar', length: 30, nullable: true })
  bankAccountType!: string | null;

  @Column({ name: 'bank_account_number', type: 'varchar', length: 80, nullable: true })
  bankAccountNumber!: string | null;

  @Column({ name: 'beneficiary_name', type: 'varchar', length: 180, nullable: true })
  beneficiaryName!: string | null;

  @Column({ name: 'beneficiary_document', type: 'varchar', length: 80, nullable: true })
  beneficiaryDocument!: string | null;

  @Column({ name: 'beneficiary_document_type', type: 'varchar', length: 50, nullable: true })
  beneficiaryDocumentType!: string | null;

  @Column({ type: 'enum', enum: RecordStatus, default: RecordStatus.ACTIVE })
  status!: RecordStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
