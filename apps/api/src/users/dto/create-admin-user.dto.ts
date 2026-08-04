import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class CreateAdminUserDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEmail()
  email?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  phone?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  documentNumber?: string;
}
