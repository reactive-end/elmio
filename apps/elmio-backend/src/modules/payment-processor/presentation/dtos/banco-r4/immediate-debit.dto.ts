import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Matches } from 'class-validator';

/**
 * DTO de entrada para Debito Inmediato en Banco R4.
 */
export class ImmediateDebitRequestDto {
  @ApiProperty({
    example: 'a3d4f6f6-8f9a-4f3f-9e80-91d5d5f4aa00',
    description:
      'Id de la cuenta interna de empresa para resolver credenciales R4.',
  })
  @IsString()
  @IsNotEmpty()
  companyAccountId!: string;

  @ApiProperty({
    example: '0134',
    description: 'Codigo del banco emisor.',
  })
  @IsString()
  @Matches(/^\d{3,4}$/, {
    message: 'bankCode debe contener 3 o 4 digitos',
  })
  bankCode!: string;

  @ApiProperty({
    example: 150.75,
    description:
      'Monto de la operacion. Se formatea a 2 decimales en la estrategia.',
  })
  @IsNumber({}, { message: 'amount debe ser un numero valido' })
  amount!: number;

  @ApiProperty({
    example: '04141234567',
    description: 'Telefono del cliente (11 digitos).',
  })
  @IsString()
  @Matches(/^\d{11}$/, {
    message: 'phoneNumber debe contener exactamente 11 digitos',
  })
  phoneNumber!: string;

  @ApiProperty({
    example: '12345678',
    description: 'Cedula del cliente.',
  })
  @IsString()
  @IsNotEmpty()
  nationalId!: string;

  @ApiProperty({
    example: 'Juan Perez',
    description: 'Nombre del cliente.',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({
    example: '123456',
    description: 'OTP de la operacion.',
  })
  @IsString()
  @IsNotEmpty()
  otp!: string;

  @ApiProperty({
    example: 'Pago de servicio',
    description: 'Concepto del debito.',
  })
  @IsString()
  @IsNotEmpty()
  concept!: string;
}

/**
 * DTO de respuesta normalizada para Debito Inmediato en Banco R4.
 */
export class ImmediateDebitResponseDto {
  @ApiProperty({ example: 'ACCP' })
  code!: string;

  @ApiProperty({ example: 'Operacion Aceptada' })
  message!: string;

  @ApiProperty({ example: '16142940' })
  reference!: string;

  @ApiProperty({ example: '6785d97e-2092-49f0-9f7d-3d5921f0b13f' })
  id!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Respuesta original enviada por Banco R4.',
  })
  rawResponse!: any;
}
