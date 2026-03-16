import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateHrIncapacityDto {
  @IsInt()
  branchId!: number;

  @IsInt()
  personId!: number;

  @IsString()
  reason!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsString()
  supportUrl?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
