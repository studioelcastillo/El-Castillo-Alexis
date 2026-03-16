import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsInt, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { UserRoleAssignmentDto } from './user-role-assignment.dto';

export class CreateUserDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  defaultBranchId?: number | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserRoleAssignmentDto)
  roleAssignments!: UserRoleAssignmentDto[];
}
