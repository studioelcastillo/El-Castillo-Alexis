import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { RecordStatus } from '../../../database/entities/enums';

export class UpdatePersonDocumentDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  legacyLabel?: string | null;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  fileType?: string | null;

  @IsOptional()
  @IsString()
  documentNumber?: string | null;

  @IsOptional()
  @IsString()
  storageBucket?: string | null;

  @IsOptional()
  @IsString()
  storagePath?: string | null;

  @IsOptional()
  @IsString()
  publicUrl?: string | null;

  @IsOptional()
  @IsDateString()
  issuedAt?: string | null;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
