import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateOnlineSessionDto {
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
  label?: string;

  @IsOptional()
  @IsString()
  platformName?: string | null;

  @IsOptional()
  @IsString()
  startedAt?: string;

  @IsOptional()
  @IsString()
  endedAt?: string | null;

  @IsOptional()
  @IsInt()
  tokenCount?: number | null;

  @IsOptional()
  @IsString()
  grossAmount?: string | null;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
