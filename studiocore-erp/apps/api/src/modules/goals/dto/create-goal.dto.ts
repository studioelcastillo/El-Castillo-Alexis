import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateGoalDto {
  @IsInt()
  branchId!: number;

  @IsInt()
  personId!: number;

  @IsOptional()
  @IsInt()
  shiftId?: number | null;

  @IsString()
  title!: string;

  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;

  @IsString()
  targetAmount!: string;

  @IsOptional()
  @IsString()
  achievedAmount?: string;

  @IsOptional()
  @IsString()
  bonusAmount?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
