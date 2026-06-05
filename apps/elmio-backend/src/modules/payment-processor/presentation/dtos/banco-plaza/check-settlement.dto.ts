import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * DTO para consultar la liquidación de un cobro por domiciliación.
 */
export class CheckSettlementDto {
  /** Id interno de la cuenta de empresa usada para resolver credenciales. */
  @IsUUID()
  @IsNotEmpty()
  companyAccountId: string;

  /** Proveedor de la pasarela (ej: banco_plaza). */
  @IsString()
  @IsNotEmpty()
  provider: string;

  /** Referencia retornada por el banco al iniciar el cobro. */
  @IsString()
  @IsNotEmpty()
  reference: string;
}
