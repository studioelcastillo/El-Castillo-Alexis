import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { cloneBaseCatalogGroup, cloneBaseCatalogGroups } from '../../common/constants/base-catalogs';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CatalogGroup, type CatalogGroupItem } from '../../database/entities/catalog-group.entity';
import { CreateCatalogGroupDto } from './dto/create-catalog-group.dto';
import { UpdateCatalogGroupDto } from './dto/update-catalog-group.dto';

type CatalogGroupView = {
  id: number | null;
  companyId: number | null;
  key: string;
  label: string;
  description: string;
  scope: 'system' | 'company';
  items: CatalogGroupItem[];
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
};

@Injectable()
export class CatalogsService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(CatalogGroup)
    private readonly catalogGroupRepository: Repository<CatalogGroup>,
  ) {}

  async list(currentUser: CurrentUserContext) {
    const baseGroups: CatalogGroupView[] = cloneBaseCatalogGroups().map((group) => this.serializeBaseGroup(group));
    const customGroups = await this.catalogGroupRepository.find({
      where: { companyId: currentUser.companyId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });

    const merged = [...baseGroups];
    for (const group of customGroups) {
      const serialized = this.serializeCatalogGroup(group);
      const baseIndex = merged.findIndex((item) => item.key === serialized.key);
      if (baseIndex >= 0) {
        merged[baseIndex] = serialized;
      } else {
        merged.push(serialized);
      }
    }

    return { items: merged };
  }

  async findOne(currentUser: CurrentUserContext, key: string) {
    const normalizedKey = this.normalizeKey(key);
    const customGroup = await this.catalogGroupRepository.findOne({
      where: { companyId: currentUser.companyId, key: normalizedKey, deletedAt: IsNull() },
    });
    if (customGroup) {
      return { data: this.serializeCatalogGroup(customGroup) };
    }

    const group = cloneBaseCatalogGroup(normalizedKey);
    if (!group) {
      throw new NotFoundException('Catalog group not found');
    }

    return { data: this.serializeBaseGroup(group) };
  }

  async create(
    currentUser: CurrentUserContext,
    dto: CreateCatalogGroupDto,
    requestMeta?: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const payload = this.normalizePayload(dto);
    await this.ensureUniqueKey(currentUser.companyId, payload.key);

    const group = await this.catalogGroupRepository.save(
      this.catalogGroupRepository.create({
        companyId: currentUser.companyId,
        ...payload,
      }),
    );

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'catalogs',
      action: 'create',
      entityType: 'catalog_group',
      entityId: String(group.id),
      afterData: this.serializeCatalogGroup(group),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializeCatalogGroup(group) };
  }

  async findCustomGroup(currentUser: CurrentUserContext, id: number) {
    const group = await this.findCustomGroupOrFail(currentUser.companyId, id);
    return { data: this.serializeCatalogGroup(group) };
  }

  async update(
    currentUser: CurrentUserContext,
    id: number,
    dto: UpdateCatalogGroupDto,
    requestMeta?: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const existing = await this.findCustomGroupOrFail(currentUser.companyId, id);
    const payload = this.normalizePayload(dto, existing);

    if (payload.key !== existing.key) {
      await this.ensureUniqueKey(currentUser.companyId, payload.key, existing.id);
    }

    const before = this.serializeCatalogGroup(existing);
    await this.catalogGroupRepository.update(
      { id: existing.id },
      {
        key: payload.key,
        label: payload.label,
        description: payload.description,
        items: payload.items,
      },
    );

    const after = await this.findCustomGroupOrFail(currentUser.companyId, existing.id);
    const serialized = this.serializeCatalogGroup(after);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'catalogs',
      action: 'edit',
      entityType: 'catalog_group',
      entityId: String(existing.id),
      beforeData: before,
      afterData: serialized,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: serialized };
  }

  async remove(
    currentUser: CurrentUserContext,
    id: number,
    requestMeta?: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const existing = await this.findCustomGroupOrFail(currentUser.companyId, id);
    const before = this.serializeCatalogGroup(existing);

    await this.catalogGroupRepository.delete({ id: existing.id });

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'catalogs',
      action: 'delete',
      entityType: 'catalog_group',
      entityId: String(existing.id),
      beforeData: before,
      afterData: null,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { success: true };
  }

  private serializeBaseGroup(group: ReturnType<typeof cloneBaseCatalogGroups>[number]): CatalogGroupView {
    return {
      id: null,
      companyId: null,
      key: group.key,
      label: group.label,
      description: group.description,
      scope: 'system' as const,
      items: group.items.map((item) => ({ ...item })),
      createdAt: null,
      updatedAt: null,
      deletedAt: null,
    };
  }

  private serializeCatalogGroup(group: CatalogGroup): CatalogGroupView {
    return {
      id: group.id,
      companyId: group.companyId,
      key: group.key,
      label: group.label,
      description: group.description ?? '',
      scope: 'company' as const,
      items: [...group.items].sort((left, right) => left.sortOrder - right.sortOrder).map((item) => ({ ...item })),
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
      deletedAt: group.deletedAt ? group.deletedAt.toISOString() : null,
    };
  }

  private normalizePayload(
    dto: CreateCatalogGroupDto | UpdateCatalogGroupDto,
    fallback?: Pick<CatalogGroup, 'key' | 'label' | 'description' | 'items'>,
  ) {
    const key = dto.key !== undefined ? this.normalizeKey(dto.key) : fallback?.key;
    const label = dto.label !== undefined ? this.trimRequired(dto.label, 'Catalog label is required') : fallback?.label;
    const description = dto.description !== undefined ? this.toNullableString(dto.description) : fallback?.description ?? null;
    const items = dto.items !== undefined ? this.normalizeItems(dto.items) : fallback?.items;

    if (!key) {
      throw new BadRequestException('Catalog key is required');
    }
    if (!label) {
      throw new BadRequestException('Catalog label is required');
    }
    if (!items?.length) {
      throw new BadRequestException('Catalog items are required');
    }

    return { key, label, description, items };
  }

  private normalizeItems(items: Array<{ value: string; label?: string; description?: string | null; isDefault?: boolean }>): CatalogGroupItem[] {
    const normalized = items.map((item, index) => {
      const value = (item.value || '').trim();
      const label = (item.label || '').trim() || value;
      if (!value && !label) {
        throw new BadRequestException(`Catalog item #${index + 1} needs a value or label`);
      }

      return {
        value,
        label: label || `Opcion ${index + 1}`,
        description: this.toNullableString(item.description),
        sortOrder: index + 1,
        isDefault: Boolean(item.isDefault),
      };
    });

    const seenValues = new Set<string>();
    for (const item of normalized) {
      if (seenValues.has(item.value)) {
        throw new BadRequestException('Catalog item values must be unique within the group');
      }
      seenValues.add(item.value);
    }

    const defaultIndex = normalized.findIndex((item) => item.isDefault);
    const resolvedDefaultIndex = defaultIndex >= 0 ? defaultIndex : 0;
    return normalized.map((item, index) => ({
      ...item,
      isDefault: index === resolvedDefaultIndex,
    }));
  }

  private async findCustomGroupOrFail(companyId: number, id: number) {
    const group = await this.catalogGroupRepository.findOne({
      where: { id, companyId, deletedAt: IsNull() },
    });
    if (!group) {
      throw new NotFoundException('Catalog group not found');
    }
    return group;
  }

  private async ensureUniqueKey(companyId: number, key: string, excludeId?: number) {
    const existing = await this.catalogGroupRepository.findOne({
      where: { companyId, key, deletedAt: IsNull() },
    });
    if (existing && existing.id !== excludeId) {
      throw new BadRequestException('Catalog key is already registered for this company');
    }
  }

  private normalizeKey(key: string) {
    const normalized = (key || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!normalized) {
      throw new BadRequestException('Catalog key is invalid');
    }

    return normalized;
  }

  private trimRequired(value: string, message: string) {
    const normalized = (value || '').trim();
    if (!normalized) {
      throw new BadRequestException(message);
    }
    return normalized;
  }

  private toNullableString(value: string | null | undefined) {
    const normalized = (value || '').trim();
    return normalized || null;
  }
}
