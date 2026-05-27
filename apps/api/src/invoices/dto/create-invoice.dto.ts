import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDateString, IsString, Min, ValidateNested } from 'class-validator';

export class InvoiceLineItemInputDto {
  @IsString()
  itemId!: string;

  @Type(() => Number)
  @Min(1)
  quantity!: number;
}

export class CreateInvoiceDto {
  @IsString()
  leaseId!: string;

  @IsDateString()
  period!: string;

  @IsDateString()
  dueDate!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemInputDto)
  services!: InvoiceLineItemInputDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemInputDto)
  products: InvoiceLineItemInputDto[] = [];
}
