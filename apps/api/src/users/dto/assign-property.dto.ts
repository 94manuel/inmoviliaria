import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class AssignPropertyDto {
  @IsString()
  propertyId!: string;

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
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedMonthlyPayment?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  createCurrentInvoice?: boolean;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  invoiceDueDate?: string;
}
