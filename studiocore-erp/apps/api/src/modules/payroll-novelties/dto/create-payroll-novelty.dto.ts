import { IsBoolean, IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePayrollNoveltyDto {
  @IsInt()
  periodId!: number;

  @IsInt()
  personId!: number;

  @IsString()
  noveltyType!: string;

  @IsString()
  title!: string;

  @IsString()
  amount!: string;

  @IsDateString()
  effectiveDate!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
