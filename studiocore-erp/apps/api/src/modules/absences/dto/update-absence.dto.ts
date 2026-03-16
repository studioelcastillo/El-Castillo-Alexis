import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateAbsenceDto {
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
  startsAt?: string;

  @IsOptional()
  @IsString()
  endsAt?: string | null;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  supportUrl?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
