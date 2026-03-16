import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CatalogItemDto {
  @IsString()
  value!: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
