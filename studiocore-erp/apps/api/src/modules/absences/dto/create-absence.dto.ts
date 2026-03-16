import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAbsenceDto {
  @IsInt()
  branchId!: number;

  @IsInt()
  personId!: number;

  @IsOptional()
  @IsInt()
  shiftId?: number | null;

  @IsString()
  startsAt!: string;

  @IsOptional()
  @IsString()
  endsAt?: string;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  supportUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
