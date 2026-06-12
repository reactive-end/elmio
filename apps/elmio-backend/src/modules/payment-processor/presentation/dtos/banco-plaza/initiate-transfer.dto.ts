import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  ValidateIf,
  IsUUID,
} from 'class-validator';

/**
 * DTO para iniciar una transferencia.
 * Contiene los datos necesarios para que una estrategia de pago
 * pueda procesar la transferencia.
 */
export class InitiateTransferDto {
  /** Id interno de la cuenta de empresa (cuenta origen para este endpoint). */
  @IsUUID()
  @IsNotEmpty()
  companyAccountId: string;

  /**
   * Proveedor de pago (por ejemplo: "PLAZA").
   */
  @IsString()
  @IsNotEmpty()
  provider: string;

  /**
   * Nombre del beneficiario.
   */
  @IsString()
  @IsNotEmpty()
  beneficiaryName: string;

  /**
   * Identificación del beneficiario (por ejemplo: V123456).
   */
  @IsString()
  @IsNotEmpty()
  beneficiaryId: string;

  /**
   * Código del banco beneficiario (por ejemplo: 0102, 0105).
   */
  @IsString()
  @IsNotEmpty()
  beneficiaryBankCode: string;

  /**
   * Monto a transferir.
   */
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  /**
   * Concepto o descripción de la transferencia.
   */
  @IsString()
  @IsNotEmpty()
  concept: string;

  /**
   * Número de cuenta destino. Requerido si no se proporciona `beneficiaryPhone`.
   */
  @ValidateIf((o) => !o.beneficiaryPhone)
  @IsString()
  @IsNotEmpty()
  beneficiaryAccount?: string;

  /**
   * Teléfono del beneficiario. Requerido si no se proporciona `beneficiaryAccount`.
   */
  @ValidateIf((o) => !o.beneficiaryAccount)
  @IsString()
  @IsNotEmpty()
  beneficiaryPhone?: string;

  /**
   * IP del usuario que origina la petición (opcional).
   */
  @IsString()
  @IsOptional()
  userIp?: string;
}
