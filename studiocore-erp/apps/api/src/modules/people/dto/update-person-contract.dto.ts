import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdatePersonContractDto {
  @IsOptional()
  @IsString()
  contractType?: string;

  @IsOptional()
  @IsString()
  contractNumber?: string | null;

  @IsOptional()
  @IsString()
  commissionType?: string | null;

  @IsOptional()
  @IsString()
  commissionPercent?: string | null;

  @IsOptional()
  @IsString()
  goalAmount?: string | null;

  @IsOptional()
  @IsString()
  positionName?: string | null;

  @IsOptional()
  @IsString()
  areaName?: string | null;

  @IsOptional()
  @IsString()
  cityName?: string | null;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @IsString()
  monthlySalary?: string | null;

  @IsOptional()
  @IsString()
  biweeklySalary?: string | null;

  @IsOptional()
  @IsString()
  dailySalary?: string | null;

  @IsOptional()
  @IsString()
  uniformAmount?: string | null;

  @IsOptional()
  @IsBoolean()
  hasWithholding?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSena?: boolean;

  @IsOptional()
  @IsBoolean()
  hasCompensationBox?: boolean;

  @IsOptional()
  @IsBoolean()
  hasIcbf?: boolean;

  @IsOptional()
  @IsString()
  arlRiskLevel?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
