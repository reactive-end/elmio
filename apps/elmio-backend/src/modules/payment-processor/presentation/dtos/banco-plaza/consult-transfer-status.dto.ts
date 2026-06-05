import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Length,
  Matches,
  IsUUID,
} from 'class-validator';

/**
 * DTO para consultar el estado de una transferencia.
 * Contiene los parámetros necesarios para que la estrategia
 * pueda localizar la operación en la pasarela.
 */
export class ConsultTransferStatusDto {
  /** Id interno de la cuenta de empresa (cuenta origen para este endpoint). */
  @IsUUID()
  @IsNotEmpty()
  companyAccountId: string;

  /** Proveedor de pasarela (ej.: "PLAZA") */
  @IsString()
  @IsNotEmpty()
  provider: string;

  /** Identificador del originador usado en la URL (quien envió el dinero) */
  @IsString()
  @IsNotEmpty()
  originatorId: string;

  /** Cuenta de origen (20 dígitos) */
  @IsString()
  @Length(20, 20)
  @IsNotEmpty()
  account: string;

  /** Referencia devuelta por el banco al realizar el pago */
  @IsString()
  @IsNotEmpty()
  reference: string;

  /** Monto exacto de la operación */
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  /**
   * Fecha de la operación en formato YYMMDD (ej.: 250207).
   * Validada mediante regex para asegurar longitud y formato.
   */
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, {
    message: 'La fecha debe tener formato YYMMDD (Ej: 250207)',
  })
  date: string;

  /** Canal o subcanal usado en la consulta (opcional, por defecto '23') */
  @IsString()
  @IsOptional()
  channel?: string;
}
