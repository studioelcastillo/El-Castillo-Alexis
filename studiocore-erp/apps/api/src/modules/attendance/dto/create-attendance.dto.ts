import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAttendanceDto {
  @IsInt()
  branchId!: number;

  @IsInt()
  personId!: number;

  @IsOptional()
  @IsInt()
  shiftId?: number | null;

  @IsDateString()
  attendanceDate!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  checkInAt?: string;

  @IsOptional()
  @IsString()
  checkOutAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
