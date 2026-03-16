import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateGoalDto {
  @IsOptional()
  @IsInt()
  branchId?: number;

  @IsOptional()
  @IsInt()
  personId?: number;

  @IsOptional()
  @IsInt()
  shiftId?: number | null;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @IsOptional()
  @IsString()
  targetAmount?: string;

  @IsOptional()
  @IsString()
  achievedAmount?: string | null;

  @IsOptional()
  @IsString()
  bonusAmount?: string | null;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
