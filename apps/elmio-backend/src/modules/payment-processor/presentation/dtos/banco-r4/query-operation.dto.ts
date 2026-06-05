import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO de entrada para consultar una operación R4 usando la referencia interna.
 */
export class QueryOperationRequestDto {
  @ApiProperty({
    example: 'fb23069b-c125-4c6b-8755-26ff414bac33',
    description:
      'Id de la cuenta interna de empresa para resolver credenciales R4.',
  })
  @IsString()
  @IsNotEmpty()
  companyAccountId!: string;

  @ApiProperty({
    example: '12345678',
    description: 'Referencia interna de la operación guardada en el sistema.',
  })
  @IsString()
  @IsNotEmpty()
  reference!: string;
}

/**
 * DTO de respuesta normalizada para consulta de operaciones R4.
 */
export class QueryOperationResponseDto {
  @ApiProperty({ example: 'ACCP' })
  code!: string;

  @ApiProperty({ example: '12345678' })
  reference!: string;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Respuesta original enviada por Banco R4.',
  })
  rawResponse!: any;
}
