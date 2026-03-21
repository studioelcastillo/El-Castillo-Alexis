import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNumberString, IsOptional, IsString } from 'class-validator';
import { FinancialTransactionType } from '../../../database/entities/enums';

export class UpdateFinancialTransactionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  accountId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  destinationAccountId?: number;

  @IsOptional()
  @IsEnum(FinancialTransactionType)
  type?: FinancialTransactionType;

  @IsOptional()
  @IsNumberString()
  amount?: string;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  personId?: number | null;

  @IsOptional()
  @IsString()
  relatedEntityType?: string | null;

  @IsOptional()
  @IsString()
  relatedEntityId?: string | null;
}
