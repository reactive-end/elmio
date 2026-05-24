import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Matches } from 'class-validator'

/**
 * DTO de entrada para domiciliación R4 por cuenta de 20 dígitos.
 */
export class AccountDirectDebitDto {
  @ApiProperty({
    example: 'a3d4f6f6-8f9a-4f3f-9e80-91d5d5f4aa00',
    description:
      'Id de la cuenta interna de empresa para resolver credenciales R4.',
  })
  @IsString()
  @IsNotEmpty()
  companyAccountId!: string

  /**
   * Documento de identidad del cliente (cédula/RIF/pasaporte según integración).
   */
  @ApiProperty({
    example: 'V12345678',
    description: 'Documento de identidad del cliente.',
  })
  @IsString()
  @IsNotEmpty()
  documentId!: string

  /**
   * Nombre del titular de la cuenta.
   */
  @ApiProperty({
    example: 'Juan Perez',
    description: 'Nombre del titular de la cuenta a debitar.',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string

  /**
   * Cuenta bancaria de 20 dígitos.
   */
  @ApiProperty({
    example: '01050001010000012345',
    description: 'Cuenta de 20 dígitos asociada a la domiciliación.',
  })
  @IsString()
  @Matches(/^\d{20}$/, {
    message: 'accountNumber debe contener exactamente 20 dígitos',
  })
  accountNumber!: string

  /**
   * Monto a debitar en formato string según contrato de R4.
   */
  @ApiProperty({
    example: '150.75',
    description: 'Monto en formato string con hasta 2 decimales.',
  })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount debe ser numérico y puede tener hasta 2 decimales',
  })
  amount!: string

  /**
   * Concepto del débito.
   */
  @ApiProperty({
    example: 'Cobro de servicio mensual',
    description: 'Concepto de la domiciliación.',
  })
  @IsString()
  @IsNotEmpty()
  concept!: string
}

/**
 * DTO de respuesta normalizada para domiciliación R4 por cuenta.
 */
export class AccountDirectDebitResponseDto {
  /**
   * Código de respuesta devuelto por el banco.
   */
  @ApiProperty({
    example: '202',
    description: 'Código de respuesta devuelto por Banco R4.',
  })
  code!: string

  /**
   * Mensaje descriptivo devuelto por el banco.
   */
  @ApiProperty({
    example: 'Solicitud procesada',
    description: 'Mensaje devuelto por Banco R4.',
  })
  message!: string

  /**
   * UUID de trazabilidad generado por el banco.
   */
  @ApiProperty({
    example: 'f01a4ec5-987c-4955-b83a-8c38e2f06438',
    description: 'Identificador único retornado por Banco R4.',
  })
  uuid!: string

  /**
   * Respuesta cruda del banco para auditoría.
   */
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Respuesta original enviada por Banco R4.',
  })
  rawResponse!: any
}
