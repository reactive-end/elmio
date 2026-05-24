import { Transform } from 'class-transformer'
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator'

/**
 * DTO para iniciar un cobro por domiciliación (Débito Inmediato CCE).
 *
 * Este flujo representa un cobro donde el cliente (pagador) es origen
 * externo y la empresa es el destino interno.
 */
export class InitiateDirectDebitDto {
  /** Id interno de la cuenta de empresa (cuenta destino para este endpoint). */
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID()
  @IsNotEmpty()
  companyAccountId: string

  /** Proveedor de la pasarela (ej: banco_plaza). */
  @IsString()
  @IsNotEmpty()
  provider: string

  /** Monto a cobrar en bolívares. */
  @IsNumber()
  @IsNotEmpty()
  amount: number

  /** Concepto del cobro. */
  @IsString()
  @IsNotEmpty()
  concept: string

  /** Código bancario del pagador (4 dígitos, ej: 0105). */
  @IsString()
  @Length(4, 4)
  payerBankCode: string

  /** Cuenta bancaria del pagador (20 dígitos). */
  @IsString()
  @Length(20, 20)
  payerAccount: string

  /** Documento del pagador (alias principal). */
  @ValidateIf((o) => !o.payerId)
  @IsString()
  @IsNotEmpty()
  payerDocument?: string

  /** Documento del pagador (alias alterno para compatibilidad). */
  @ValidateIf((o) => !o.payerDocument)
  @IsString()
  @IsNotEmpty()
  payerId?: string

  /** Nombre completo del pagador. */
  @IsString()
  @IsNotEmpty()
  payerName: string

  /** Identificador del contrato de domiciliacion. Maximo 15 caracteres. */
  @IsString()
  @IsNotEmpty()
  @Length(1, 15)
  contratoId: string

  /** Fecha del contrato en formato YYYY-MM-DD. */
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fechaContrato: string

  /** IP del cliente para auditoría (opcional, se completa desde request si no viene). */
  @IsOptional()
  @IsString()
  userIp?: string
}
