import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsString, Min } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  leaseId!: string;

  @IsDateString()
  period!: string;

  @IsDateString()
  dueDate!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;
}
