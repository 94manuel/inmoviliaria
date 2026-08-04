import { Type } from 'class-transformer';
import { IsEmail, IsISO8601, IsInt, IsObject, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';

export class BancolombiaNotificationDto {
  @IsString()
  @MinLength(1)
  outlookMessageId!: string;

  @IsOptional()
  @IsString()
  internetMessageId?: string | null;

  @IsEmail()
  sender!: string;

  @IsString()
  subject!: string;

  @IsString()
  @MinLength(2)
  payerName!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @Matches(/^\d{4}$/)
  accountLast4!: string;

  @IsOptional()
  @IsString()
  bankReference?: string | null;

  @IsISO8601()
  receivedAt!: string;

  @IsOptional()
  @IsObject()
  rawPayload?: Record<string, unknown>;
}
