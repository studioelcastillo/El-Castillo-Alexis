import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { UserStatus } from '../../../database/entities/enums';
import { UserRoleAssignmentDto } from './user-role-assignment.dto';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  defaultBranchId?: number | null;

  @IsOptional()
  @IsString()
  status?: UserStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserRoleAssignmentDto)
  roleAssignments?: UserRoleAssignmentDto[];
}
