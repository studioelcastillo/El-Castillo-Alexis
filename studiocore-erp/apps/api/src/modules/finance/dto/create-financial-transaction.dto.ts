import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';
import { FinancialTransactionType } from '../../../database/entities/enums';

export class CreateFinancialTransactionDto {
  @IsInt()
  @IsNotEmpty()
  accountId!: number;

  @IsEnum(FinancialTransactionType)
  @IsNotEmpty()
  type!: FinancialTransactionType;

  @IsNumberString()
  @IsNotEmpty()
  amount!: string;

  @IsDateString()
  @IsOptional()
  transactionDate?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsInt()
  @IsOptional()
  personId?: number;

  @IsString()
  @IsOptional()
  relatedEntityType?: string;

  @IsString()
  @IsOptional()
  relatedEntityId?: string;
}
