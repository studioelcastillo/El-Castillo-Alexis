import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateAttendanceDto {
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
  @IsDateString()
  attendanceDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  checkInAt?: string | null;

  @IsOptional()
  @IsString()
  checkOutAt?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
