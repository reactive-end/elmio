import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  Length,
  IsUUID,
} from 'class-validator'

/**
 * DTO para enviar pagos móviles.
 *
 * Propiedades validadas mediante decoradores de `class-validator`.
 */
export class SendMobilePaymentDto {
  /** Id interno de la cuenta de empresa (cuenta origen para este endpoint). */
  @IsUUID()
  @IsNotEmpty()
  companyAccountId: string

  /** Identificador del proveedor (ej. 'PLAZA'). */
  @IsString()
  @IsNotEmpty()
  provider: string

  /** Código del banco destino (4 caracteres, ej. '0102'). */
  @IsString()
  @Length(4, 4)
  destinationBankCode: string

  /** Cédula o RIF del beneficiario. */
  @IsString()
  @IsNotEmpty()
  destinationId: string

  /** Teléfono del beneficiario (ej. 4141234567). */
  @IsString()
  @IsNotEmpty()
  destinationPhone: string

  /** Monto a transferir. */
  @IsNumber()
  @IsNotEmpty()
  amount: number

  /** Concepto o descripción del pago. */
  @IsString()
  @IsNotEmpty()
  concept: string

  /** IP del usuario (opcional). La estrategia puede aplicar un valor por defecto. */
  @IsString()
  @IsOptional()
  userIp?: string

  /** Latitud para auditoría/geo (opcional). */
  @IsString()
  @IsOptional()
  latitude?: string

  /** Longitud para auditoría/geo (opcional). */
  @IsString()
  @IsOptional()
  longitude?: string
}
