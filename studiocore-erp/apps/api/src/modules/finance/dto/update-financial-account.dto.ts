import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { FinancialAccountType } from '../../../database/entities/enums';

export class UpdateFinancialAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsEnum(FinancialAccountType)
  type?: FinancialAccountType;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  bankName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  accountNumber?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
