import { Transform } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  ValidateIf,
  Length,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

/**
 * Tipos de validación disponibles al solicitar un token de débito.
 * - `CUENTA` ('C'): Validación por número de cuenta.
 * - `TELEFONO` ('T'): Validación por número de teléfono.
 */
export enum DebitValidationType {
  CUENTA = 'C',
  TELEFONO = 'T',
}

/**
 * DTO para solicitar un token de débito (Token DI).
 * Contiene la información mínima que requiere la pasarela para
 * generar y enviar el token al pagador.
 */
export class RequestDebitTokenDto {
  /** Id interno de la cuenta de empresa (cuenta destino para este endpoint). */
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsUUID()
  companyAccountId?: string;

  /** Proveedor de pasarela (ej.: "PLAZA"). */
  @IsString()
  @IsNotEmpty()
  provider: string;

  /** Tipo de validación a utilizar: `C` = cuenta, `T` = teléfono. */
  @IsEnum(DebitValidationType)
  validationType: DebitValidationType;

  /** Identificador del pagador (ej.: V12345678). Longitud: 10-12. */
  @IsString()
  @Length(10, 12)
  payerId: string;

  /** Código del banco del pagador (ej.: '0134'). */
  @IsString()
  payerBankCode: string;

  /** Monto asociado a la solicitud de token. */
  @IsNumber()
  amount: number;

  /** IP origen para auditoría (opcional). */
  @IsOptional()
  @IsString()
  ipAddress?: string;

  /**
   * Número de cuenta del pagador (obligatorio cuando `validationType` = `CUENTA`).
   * Validado condicionalmente mediante `@ValidateIf`.
   */
  @ValidateIf((o) => o.validationType === DebitValidationType.CUENTA)
  @IsString()
  @Length(20, 20)
  payerAccount?: string;

  /**
   * Teléfono del pagador (obligatorio cuando `validationType` = `TELEFONO`).
   * Validado condicionalmente mediante `@ValidateIf`.
   */
  @ValidateIf((o) => o.validationType === DebitValidationType.TELEFONO)
  @IsString()
  payerPhone?: string;
}
