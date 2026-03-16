import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateHrDisciplinaryActionDto {
  @IsInt()
  branchId!: number;

  @IsInt()
  personId!: number;

  @IsString()
  actionType!: string;

  @IsString()
  title!: string;

  @IsDateString()
  effectiveDate!: string;

  @IsOptional()
  @IsString()
  supportUrl?: string;

  @IsOptional()
  @IsString()
  payrollImpactAmount?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
