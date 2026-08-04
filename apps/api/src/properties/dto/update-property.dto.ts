import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyRent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  administrationFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deposit?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  areaM2?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  parking?: number;

  @IsOptional()
  @IsString()
  features?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsIn(['KEEP', 'APPEND', 'REPLACE', 'DEFAULT'])
  imageMode?: 'KEEP' | 'APPEND' | 'REPLACE' | 'DEFAULT';

  @IsOptional()
  @IsIn(['KEEP', 'REPLACE', 'REMOVE'])
  tour360Mode?: 'KEEP' | 'REPLACE' | 'REMOVE';

  @IsOptional()
  @IsIn(['UNCHANGED', 'NONE', 'EXISTING', 'NEW'])
  assignmentMode?: 'UNCHANGED' | 'NONE' | 'EXISTING' | 'NEW';

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  tenantId?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MinLength(3)
  tenantName?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEmail()
  tenantEmail?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  tenantPhone?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  tenantDocumentNumber?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  leaseStartDate?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  leaseEndDate?: string;

  @IsOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber()
  @Min(0)
  expectedMonthlyPayment?: number;
}
