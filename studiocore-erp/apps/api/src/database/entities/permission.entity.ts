import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
@Unique('uq_permissions_module_action', ['moduleKey', 'actionKey'])
export class Permission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'module_key', type: 'varchar', length: 100 })
  moduleKey!: string;

  @Column({ name: 'action_key', type: 'varchar', length: 100 })
  actionKey!: string;

  @Column({ type: 'varchar', length: 150 })
  description!: string;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions!: RolePermission[];
}
