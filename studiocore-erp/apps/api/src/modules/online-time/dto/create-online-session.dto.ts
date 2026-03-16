import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateOnlineSessionDto {
  @IsInt()
  branchId!: number;

  @IsInt()
  personId!: number;

  @IsOptional()
  @IsInt()
  shiftId?: number | null;

  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  platformName?: string;

  @IsString()
  startedAt!: string;

  @IsOptional()
  @IsString()
  endedAt?: string;

  @IsOptional()
  @IsInt()
  tokenCount?: number;

  @IsOptional()
  @IsString()
  grossAmount?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
