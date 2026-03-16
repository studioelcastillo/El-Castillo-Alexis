import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PersonType, RecordStatus } from '../../../database/entities/enums';

export class PeopleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;

  @IsOptional()
  @IsEnum(PersonType)
  personType?: PersonType;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}
