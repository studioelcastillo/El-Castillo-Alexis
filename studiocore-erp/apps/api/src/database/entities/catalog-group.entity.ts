import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BaseSoftDeleteEntity } from './base.entity';
import { Company } from './company.entity';

export type CatalogGroupItem = {
  value: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isDefault: boolean;
};

@Entity('catalog_groups')
@Unique('uq_catalog_groups_company_key', ['companyId', 'key'])
export class CatalogGroup extends BaseSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'company_id', type: 'int' })
  companyId!: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column({ type: 'varchar', length: 120 })
  key!: string;

  @Column({ type: 'varchar', length: 160 })
  label!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  items!: CatalogGroupItem[];
}
