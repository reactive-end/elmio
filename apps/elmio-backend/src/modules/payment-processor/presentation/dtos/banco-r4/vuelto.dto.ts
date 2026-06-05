import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator'

/**
 * DTO de entrada para Vuelto en Banco R4.
 * Permite obtener la referencia y estado de una transacción de vuelto en la red interbancaria.
 *
 * @see https://r4conecta.mibanco.com.ve/MBvuelto
 */
export class VueltoRequestDto {
  @ApiProperty({
    example: 'a3d4f6f6-8f9a-4f3f-9e80-91d5d5f4aa00',
    description: 'Id de la cuenta interna de empresa para resolver credenciales R4.',
  })
  @IsString()
  @IsNotEmpty()
  companyAccountId!: string

  @ApiProperty({
    example: '04145555555',
    description: 'Teléfono del beneficiario - 11 dígitos numéricos',
  })
  @IsString()
  @Matches(/^\d{11}$/, {
    message: 'TelefonoDestino debe contener exactamente 11 dígitos',
  })
  TelefonoDestino!: string

  @ApiProperty({
    example: 'V12345678',
    description:
      'Tipo de Documento (V, E) + Documento de identidad del beneficiario - 9 caracteres alfanuméricos',
  })
  @IsString()
  @Matches(/^[VE]\d{5,8}$/, {
    message: 'Cedula debe comenzar con V o E seguido de 5-8 dígitos',
  })
  Cedula!: string

  @ApiProperty({
    example: '0102',
    description: 'Código del banco del beneficiario - 4 dígitos numéricos',
  })
  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'Banco debe contener exactamente 4 dígitos',
  })
  Banco!: string

  @ApiProperty({
    example: '1000.00',
    description:
      'Monto con decimales separados por punto - máximo 8 números y 2 decimales',
  })
  @IsString()
  @Matches(/^\d{1,8}(\.\d{1,2})?$/, {
    message: 'Monto debe tener formato correcto (ej: 1000.00)',
  })
  Monto!: string

  @ApiProperty({
    example: 'PRUEBA',
    description: 'OPCIONAL - Motivo del pago - máximo 30 caracteres alfanuméricos',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  Concepto?: string

  @ApiProperty({
    example: '0.0.0.0',
    description:
      'OPCIONAL - IP de la máquina desde donde se está haciendo el vuelto - 8 numérico (formato IPv4)',
    required: false,
  })
  @IsOptional()
  @IsString()
  Ip?: string
}

/**
 * DTO de respuesta normalizada para Vuelto en Banco R4.
 */
export class VueltoResponseDto {
  @ApiProperty({ example: '00' })
  code!: string

  @ApiProperty({ example: 'TRANSACCION EXITOSA' })
  message!: string

  @ApiProperty({ example: '15558293', required: false })
  reference?: string

  rawResponse?: any
}

/**
 * Códigos de respuesta del endpoint de Vuelto según documentación R4.
 */
export enum VueltoStatusCode {
  /** Transacción exitosa */
  SUCCESS = '00',
  /** Token inválido */
  INVALID_TOKEN = '08',
  /** Combo celular/cédula no registrado */
  NOT_REGISTERED = '14',
  /** Sin fondos disponibles */
  NO_FUNDS = '51',
  /** Teléfono origen no existe */
  PHONE_NOT_EXISTS = '55',
  /** Teléfono no coincide con afiliado a la cédula */
  PHONE_MISMATCH = '56',
  /** Cédula del receptor inválida */
  INVALID_DOCUMENT = '80',
}