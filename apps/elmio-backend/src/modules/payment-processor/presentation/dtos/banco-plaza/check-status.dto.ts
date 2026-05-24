import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator'

/**
 * DTO para la consulta de estado de una transacción.
 */
export class CheckStatusDto {
  /** Id interno de la cuenta de empresa (cuenta destino para este endpoint). */
  @IsUUID()
  @IsNotEmpty()
  companyAccountId: string

  /**
   * Identificador del proveedor que indica qué estrategia usar (p. ej. 'banco_plaza').
   */
  @IsString()
  @IsNotEmpty()
  provider: string

  /**
   * Identificador que devuelve el banco al iniciar el pago (endToEnd).
   */
  @IsString()
  @IsNotEmpty()
  endToEndId: string

  /**
   * Monto exacto de la operación.
   */
  @IsNumber()
  @IsNotEmpty()
  amount: number

  /**
   * Referencia opcional de la transacción.
   */
  @IsString()
  @IsOptional()
  reference?: string
}
