import { IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsIn(['PENDING', 'PAID', 'OVERDUE', 'VOID'])
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'VOID';

  @IsOptional()
  @IsDateString()
  period?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
