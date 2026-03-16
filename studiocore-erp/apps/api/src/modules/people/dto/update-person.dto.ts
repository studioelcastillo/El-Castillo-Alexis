import { Type } from 'class-transformer';
import { IsDateString, IsEmail, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PersonType, RecordStatus } from '../../../database/entities/enums';

export class UpdatePersonDto {
  @IsOptional()
  @IsEnum(PersonType)
  personType?: PersonType;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number | null;

  @IsOptional()
  @IsString()
  documentType?: string | null;

  @IsOptional()
  @IsString()
  documentNumber?: string | null;

  @IsOptional()
  @IsString()
  issuedIn?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsEmail()
  personalEmail?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsDateString()
  birthDate?: string | null;

  @IsOptional()
  @IsString()
  sex?: string | null;

  @IsOptional()
  @IsString()
  bloodType?: string | null;

  @IsOptional()
  @IsString()
  modelCategory?: string | null;

  @IsOptional()
  @IsString()
  photoUrl?: string | null;

  @IsOptional()
  @IsString()
  bankEntity?: string | null;

  @IsOptional()
  @IsString()
  bankAccountType?: string | null;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string | null;

  @IsOptional()
  @IsString()
  beneficiaryName?: string | null;

  @IsOptional()
  @IsString()
  beneficiaryDocument?: string | null;

  @IsOptional()
  @IsString()
  beneficiaryDocumentType?: string | null;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
