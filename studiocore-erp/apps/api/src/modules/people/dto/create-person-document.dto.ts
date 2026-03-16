import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { RecordStatus } from '../../../database/entities/enums';

export class CreatePersonDocumentDto {
  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  legacyLabel?: string;

  @IsString()
  documentType!: string;

  @IsOptional()
  @IsString()
  fileType?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  storageBucket?: string;

  @IsOptional()
  @IsString()
  storagePath?: string;

  @IsOptional()
  @IsString()
  publicUrl?: string;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
