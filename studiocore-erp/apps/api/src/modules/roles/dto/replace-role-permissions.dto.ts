import { Type } from 'class-transformer';
import { IsArray, IsInt } from 'class-validator';

export class ReplaceRolePermissionsDto {
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  permissionIds!: number[];
}
