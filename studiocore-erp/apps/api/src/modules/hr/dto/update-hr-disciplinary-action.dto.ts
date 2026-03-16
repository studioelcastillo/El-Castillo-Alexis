import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateHrDisciplinaryActionDto {
  @IsOptional()
  @IsInt()
  branchId?: number;

  @IsOptional()
  @IsInt()
  personId?: number;

  @IsOptional()
  @IsString()
  actionType?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsString()
  supportUrl?: string | null;

  @IsOptional()
  @IsString()
  payrollImpactAmount?: string | null;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
