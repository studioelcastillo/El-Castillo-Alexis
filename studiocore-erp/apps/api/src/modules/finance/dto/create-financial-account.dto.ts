import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { FinancialAccountType } from '../../../database/entities/enums';

export class CreateFinancialAccountDto {
  @IsInt()
  @IsOptional()
  branchId?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name!: string;

  @IsEnum(FinancialAccountType)
  @IsOptional()
  type?: FinancialAccountType;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @IsString()
  @IsOptional()
  @MaxLength(180)
  bankName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  accountNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
