import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateOperationShiftDto {
  @IsInt()
  branchId!: number;

  @IsInt()
  personId!: number;

  @IsString()
  title!: string;

  @IsString()
  startsAt!: string;

  @IsString()
  endsAt!: string;

  @IsOptional()
  @IsString()
  platformName?: string;

  @IsOptional()
  @IsString()
  roomLabel?: string;

  @IsOptional()
  @IsString()
  goalAmount?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
