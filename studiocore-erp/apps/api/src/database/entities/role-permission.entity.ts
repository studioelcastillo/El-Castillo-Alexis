import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, Column } from 'typeorm';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Entity('role_permissions')
@Unique('uq_role_permissions_role_permission', ['roleId', 'permissionId'])
export class RolePermission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'role_id', type: 'int' })
  roleId!: number;

  @Column({ name: 'permission_id', type: 'int' })
  permissionId!: number;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission!: Permission;
}
