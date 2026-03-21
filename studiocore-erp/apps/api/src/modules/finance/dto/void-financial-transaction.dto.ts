import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VoidFinancialTransactionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
