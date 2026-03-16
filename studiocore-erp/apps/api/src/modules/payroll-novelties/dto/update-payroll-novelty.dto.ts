import { IsBoolean, IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdatePayrollNoveltyDto {
  @IsOptional()
  @IsInt()
  periodId?: number;

  @IsOptional()
  @IsInt()
  personId?: number;

  @IsOptional()
  @IsString()
  noveltyType?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
