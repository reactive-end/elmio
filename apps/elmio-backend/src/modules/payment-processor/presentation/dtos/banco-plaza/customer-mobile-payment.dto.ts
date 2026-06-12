import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO para pagos móviles iniciados por el cliente.
 *
 * Contiene los datos necesarios para que la estrategia procese un
 * pago donde el pagador es el cliente (se usa en endpoints tipo P2C).
 */
export class CustomerMobilePaymentDto {
  /** Identificador del proveedor (ej. 'PLAZA'). */
  @IsString()
  @IsNotEmpty()
  provider: string;

  /** RIF o cédula del cliente (se puede usar en la URL del endpoint). */
  @IsString()
  @IsNotEmpty()
  payerId: string;

  /** Teléfono del cliente (se enviará como `telefonoAfiliado` al banco). */
  @IsString()
  @IsNotEmpty()
  payerPhone: string;

  /** Monto a transferir. */
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  /** Concepto o descripción del pago. */
  @IsString()
  @IsNotEmpty()
  concept: string;

  /** IP del usuario para auditoría (opcional). */
  @IsString()
  @IsOptional()
  userIp?: string;

  /** Latitud para auditoría/geo (opcional). */
  @IsString()
  @IsOptional()
  latitude?: string;

  /** Longitud para auditoría/geo (opcional). */
  @IsString()
  @IsOptional()
  longitude?: string;
}
