import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class FinancialAccountsQueryDto {
  @IsNumberString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumberString()
  @IsOptional()
  page?: string;

  @IsNumberString()
  @IsOptional()
  pageSize?: string;
}
