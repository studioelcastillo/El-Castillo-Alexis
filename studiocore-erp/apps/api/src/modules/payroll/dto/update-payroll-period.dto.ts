import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdatePayrollPeriodDto {
  @IsOptional()
  @IsInt()
  branchId?: number;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
