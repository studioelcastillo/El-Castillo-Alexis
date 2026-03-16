import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { BaseSoftDeleteEntity } from './base.entity';
import { Company } from './company.entity';
import { RecordStatus } from './enums';
import { User } from './user.entity';
import { UserRole } from './user-role.entity';

@Entity('branches')
@Unique('uq_branches_company_code', ['companyId', 'code'])
export class Branch extends BaseSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'company_id', type: 'int' })
  companyId!: number;

  @ManyToOne(() => Company, (company) => company.branches, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: 'enum', enum: RecordStatus, default: RecordStatus.ACTIVE })
  status!: RecordStatus;

  @OneToMany(() => User, (user) => user.defaultBranch)
  users!: User[];

  @OneToMany(() => UserRole, (userRole) => userRole.branch)
  userRoles!: UserRole[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.branch)
  auditLogs!: AuditLog[];
}
