import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../database/entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async list() {
    const items = await this.permissionRepository.find({ order: { moduleKey: 'ASC', actionKey: 'ASC' } });
    return { items, total: items.length, page: 1, pageSize: items.length || 1 };
  }

  async matrix() {
    const permissions = await this.permissionRepository.find({ order: { moduleKey: 'ASC', actionKey: 'ASC' } });
    const grouped = permissions.reduce<Record<string, Array<{ id: number; actionKey: string; description: string }>>>(
      (acc, permission) => {
        acc[permission.moduleKey] = acc[permission.moduleKey] || [];
        acc[permission.moduleKey].push({
          id: permission.id,
          actionKey: permission.actionKey,
          description: permission.description,
        });
        return acc;
      },
      {},
    );

    return { items: grouped };
  }
}
