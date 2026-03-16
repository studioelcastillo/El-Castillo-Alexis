import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { BaseSoftDeleteEntity } from './base.entity';
import { Branch } from './branch.entity';
import { CatalogGroup } from './catalog-group.entity';
import { RecordStatus } from './enums';
import { Role } from './role.entity';
import { User } from './user.entity';

@Entity('companies')
export class Company extends BaseSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 200 })
  legalName!: string;

  @Column({ name: 'tax_id', type: 'varchar', length: 50, nullable: true })
  taxId!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: 'enum', enum: RecordStatus, default: RecordStatus.ACTIVE })
  status!: RecordStatus;

  @OneToMany(() => Branch, (branch) => branch.company)
  branches!: Branch[];

  @OneToMany(() => User, (user) => user.company)
  users!: User[];

  @OneToMany(() => Role, (role) => role.company)
  roles!: Role[];

  @OneToMany(() => CatalogGroup, (catalogGroup) => catalogGroup.company)
  catalogGroups!: CatalogGroup[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.company)
  auditLogs!: AuditLog[];
}
