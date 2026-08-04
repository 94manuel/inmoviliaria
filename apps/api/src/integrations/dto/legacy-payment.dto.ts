import { Type } from 'class-transformer';
import { IsISO8601, IsInt, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';

export class LegacyReconcilePaymentDto {
  @IsOptional()
  @IsString()
  cuentaDestino?: string;

  @Matches(/^\d{4}$/)
  ultimos4Cuenta!: string;

  @IsString()
  @MinLength(2)
  pagador!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  valor!: number;

  @IsOptional()
  @IsString()
  moneda?: string;

  @IsOptional()
  @IsString()
  referenciaBancaria?: string;

  @IsString()
  @MinLength(1)
  referenciaIdempotencia!: string;

  @IsISO8601()
  fechaPago!: string;

  @IsString()
  @MinLength(1)
  idCorreoOutlook!: string;

  @IsOptional()
  @IsString()
  asuntoCorreo?: string;
}

export class LegacyRegisterPaymentDto {
  @IsString()
  @MinLength(1)
  arrendatarioId!: string;

  @IsString()
  @MinLength(1)
  contratoId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  valor!: number;

  @IsOptional()
  @IsString()
  moneda?: string;

  @IsString()
  @MinLength(2)
  pagador!: string;

  @IsOptional()
  @IsString()
  banco?: string;

  @Matches(/^\d{4}$/)
  ultimos4Cuenta!: string;

  @IsOptional()
  @IsString()
  referenciaBancaria?: string;

  @IsString()
  @MinLength(1)
  referenciaIdempotencia!: string;

  @IsISO8601()
  fechaPago!: string;

  @IsString()
  @MinLength(1)
  idCorreoOutlook!: string;

  @IsOptional()
  @IsString()
  origen?: string;
}
