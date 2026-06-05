import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  Length,
} from 'class-validator';

/**
 * DTO usado cuando un cliente inicia una transferencia hacia la empresa.
 * Contiene la información mínima requerida por las estrategias para
 * procesar una transferencia desde la cuenta del cliente.
 */
export class CustomerTransferDto {
  /** Proveedor de la pasarela (ej. "PLAZA") */
  @IsString()
  @IsNotEmpty()
  provider: string;

  /** Nombre completo del pagador (empresa destino recibirá este nombre) */
  @IsString()
  @IsNotEmpty()
  payerName: string;

  /** Identificación del pagador (Cédula/RIF) */
  @IsString()
  @IsNotEmpty()
  payerId: string;

  /** Cuenta bancaria del pagador en Plaza (20 dígitos) */
  @IsString()
  @IsNotEmpty()
  @Length(20, 20)
  payerAccount: string;

  /** Monto a transferir */
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  /** Concepto o descripción de la transferencia */
  @IsString()
  @IsNotEmpty()
  concept: string;

  /** IP del usuario que origina la petición (opcional) */
  @IsString()
  @IsOptional()
  userIp?: string;
}
