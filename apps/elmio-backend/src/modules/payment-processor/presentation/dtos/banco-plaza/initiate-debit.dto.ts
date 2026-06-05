import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Length,
  IsBoolean,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { DebitValidationType } from './request-debit-token.dto';

/**
 * DTO para la operación de débito.
 * Valida y transforma los datos de entrada recibidos desde el controlador.
 */
export class InitiateDebitDto {
  /** Id interno de la cuenta de empresa (cuenta destino para este endpoint). */
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsUUID()
  companyAccountId?: string;

  /**
   * Importe a cobrar (número). Se transforma con `class-transformer`.
   */
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  amount: number;

  /**
   * Concepto o descripción del débito.
   */
  @IsString()
  @IsNotEmpty()
  concept: string;

  /**
   * Identificación del pagador (p. ej. cédula o RUC).
   */
  @IsString()
  @IsNotEmpty()
  payerId: string;

  /**
   * Nombre del pagador (se enviará al proveedor bancario).
   */
  @IsString()
  @IsNotEmpty()
  payerName: string;

  /**
   * Código de banco del pagador (exactamente 4 caracteres).
   */
  @IsString()
  @Length(4, 4)
  payerBankCode: string;

  /**
   * Tipo de validación del débito: cuenta o teléfono.
   */
  @IsEnum(DebitValidationType)
  validationType: DebitValidationType;

  /**
   * Token recibido por el pagador.
   */
  @IsString()
  @IsNotEmpty()
  token: string;

  /**
   * Teléfono del pagador (opcional, usado en pagos móviles).
   */
  @IsOptional()
  @IsString()
  payerPhone?: string;

  /**
   * Número de cuenta del pagador (opcional, usado para débito a cuenta).
   */
  @IsOptional()
  @IsString()
  payerAccount?: string;

  /**
   * Proveedor de la pasarela. Si no se suministra, la capa superior puede
   * asignar un valor por defecto (p. ej. 'PLAZA').
   */
  @IsString()
  provider?: string;

  /**
   * Indica si el pago fue iniciado por el cliente (true) o es un débito automático (false).
   */
  @IsBoolean()
  @IsOptional()
  isCustomerInitiated?: boolean;
}
