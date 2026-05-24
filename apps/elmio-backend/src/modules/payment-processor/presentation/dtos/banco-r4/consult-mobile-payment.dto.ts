import { IsNotEmpty, IsString, IsOptional } from 'class-validator'

// DTO para recibir la consulta de R4 (Request que R4 te envía)
export class ConsultMobilePaymentR4Dto {
  @IsString()
  @IsNotEmpty()
  IdCliente: string // Identificación del cliente - 8 numérico

  @IsString()
  @IsOptional() // El monto es opcional según la doc
  Monto?: string // Monto de la operación - máximo 8 números y 2 decimales

  @IsString()
  @IsNotEmpty()
  TelefonoComercio: string // Teléfono del comercio - 11 numérico
}

// DTO para la respuesta que envías a R4
export class ConsultMobilePaymentR4ResponseDto {
  status: boolean // true = aceptado, false = rechazado
}
