import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number | null;
}
