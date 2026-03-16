import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreatePersonContractDto {
  @IsString()
  contractType!: string;

  @IsOptional()
  @IsString()
  contractNumber?: string;

  @IsOptional()
  @IsString()
  commissionType?: string;

  @IsOptional()
  @IsString()
  commissionPercent?: string;

  @IsOptional()
  @IsString()
  goalAmount?: string;

  @IsOptional()
  @IsString()
  positionName?: string;

  @IsOptional()
  @IsString()
  areaName?: string;

  @IsOptional()
  @IsString()
  cityName?: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  monthlySalary?: string;

  @IsOptional()
  @IsString()
  biweeklySalary?: string;

  @IsOptional()
  @IsString()
  dailySalary?: string;

  @IsOptional()
  @IsString()
  uniformAmount?: string;

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
  arlRiskLevel?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
