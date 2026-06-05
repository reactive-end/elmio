import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

/**
 * DTO para consultar el historial de pagos móviles de un cliente.
 *
 * Contiene el proveedor, el identificador del cliente y filtros
 * opcionales que las pasarelas suelen admitir.
 */
export class ConsultMobilePaymentDto {
  /** Id interno de la cuenta de empresa (cuenta origen para este endpoint). */
  @IsUUID()
  @IsNotEmpty()
  companyAccountId: string;

  /** Identificador del proveedor (ej. 'PLAZA'). */
  @IsString()
  @IsNotEmpty()
  provider: string;

  /** RIF o cédula del cliente (se usa en la URL del endpoint). */
  @IsString()
  @IsNotEmpty()
  payerId: string;

  /** Fecha opcional para filtrar el historial (formato YYYYMMDD). */
  @IsString()
  @IsOptional()
  date?: string;

  /** Referencia opcional para filtrar resultados. */
  @IsString()
  @IsOptional()
  reference?: string;
}
