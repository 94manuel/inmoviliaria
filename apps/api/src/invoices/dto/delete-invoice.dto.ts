import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeleteInvoiceDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
