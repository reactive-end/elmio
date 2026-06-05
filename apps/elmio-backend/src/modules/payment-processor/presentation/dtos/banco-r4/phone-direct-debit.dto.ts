import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * DTO de entrada para domiciliación R4 por teléfono.
 */
export class PhoneDirectDebitDto {
  @ApiProperty({
    example: 'a3d4f6f6-8f9a-4f3f-9e80-91d5d5f4aa00',
    description:
      'Id de la cuenta interna de empresa para resolver credenciales R4.',
  })
  @IsString()
  @IsNotEmpty()
  companyAccountId!: string;

  /**
   * Documento de identidad del cliente (cédula/RIF/pasaporte según integración).
   */
  @ApiProperty({
    example: 'V12345678',
    description: 'Documento de identidad del cliente.',
  })
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  /**
   * Teléfono del cliente afiliado al banco.
   */
  @ApiProperty({
    example: '04141234567',
    description: 'Teléfono de 11 dígitos asociado a la afiliación del cliente.',
  })
  @IsString()
  @Matches(/^\d{11}$/, {
    message: 'phoneNumber debe contener exactamente 11 dígitos',
  })
  phoneNumber!: string;

  /**
   * Nombre del titular afiliado.
   */
  @ApiProperty({
    example: 'Juan Perez',
    description: 'Nombre del titular afiliado.',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  /**
   * Código del banco asociado al teléfono.
   */
  @ApiProperty({
    example: '0134',
    description: 'Código del banco emisor de la cuenta afiliada.',
  })
  @IsString()
  @Matches(/^\d{3,4}$/, {
    message: 'bankCode debe contener 3 o 4 dígitos',
  })
  bankCode!: string;

  /**
   * Monto a debitar en formato string según contrato de R4.
   */
  @ApiProperty({
    example: '120.00',
    description: 'Monto en formato string con hasta 2 decimales.',
  })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount debe ser numérico y puede tener hasta 2 decimales',
  })
  amount!: string;

  /**
   * Concepto del débito.
   */
  @ApiProperty({
    example: 'Domiciliacion de suscripcion',
    description: 'Concepto de la domiciliación.',
  })
  @IsString()
  @IsNotEmpty()
  concept!: string;
}

/**
 * DTO de respuesta normalizada para domiciliación R4 por teléfono.
 */
export class PhoneDirectDebitResponseDto {
  /**
   * Código de respuesta devuelto por el banco.
   */
  @ApiProperty({
    example: '202',
    description: 'Código de respuesta devuelto por Banco R4.',
  })
  code!: string;

  /**
   * Mensaje descriptivo devuelto por el banco.
   */
  @ApiProperty({
    example: 'Solicitud procesada',
    description: 'Mensaje devuelto por Banco R4.',
  })
  message!: string;

  /**
   * UUID de trazabilidad generado por el banco.
   */
  @ApiProperty({
    example: 'f01a4ec5-987c-4955-b83a-8c38e2f06438',
    description: 'Identificador único retornado por Banco R4.',
  })
  uuid!: string;

  /**
   * Respuesta cruda del banco para auditoría.
   */
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Respuesta original enviada por Banco R4.',
  })
  rawResponse!: any;
}
