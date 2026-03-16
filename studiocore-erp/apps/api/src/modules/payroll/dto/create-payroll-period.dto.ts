import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePayrollPeriodDto {
  @IsInt()
  branchId!: number;

  @IsString()
  code!: string;

  @IsString()
  label!: string;

  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
