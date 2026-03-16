import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateOperationShiftDto {
  @IsOptional()
  @IsInt()
  branchId?: number;

  @IsOptional()
  @IsInt()
  personId?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  platformName?: string | null;

  @IsOptional()
  @IsString()
  roomLabel?: string | null;

  @IsOptional()
  @IsString()
  goalAmount?: string | null;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
