import { Type, Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @MinLength(5)
  title!: string;

  @IsString()
  @MinLength(30)
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  monthlyRent!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  administrationFee!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deposit!: number;

  @IsString()
  city!: string;

  @IsString()
  neighborhood!: string;

  @IsString()
  address!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bedrooms!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bathrooms!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  areaM2!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  parking!: number;

  @IsOptional()
  @IsString()
  features?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  published?: boolean;
}
