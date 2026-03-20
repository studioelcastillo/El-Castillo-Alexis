import { IsDateString, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateFinancialTransferDto {
  @IsInt()
  @IsNotEmpty()
  sourceAccountId!: number;

  @IsInt()
  @IsNotEmpty()
  destinationAccountId!: number;

  @IsNumberString()
  @IsNotEmpty()
  amount!: string;

  @IsDateString()
  @IsOptional()
  transactionDate?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description!: string;
}
