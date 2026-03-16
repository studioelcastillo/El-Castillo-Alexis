import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class UserRoleAssignmentDto {
  @Type(() => Number)
  @IsInt()
  roleId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number | null;
}
