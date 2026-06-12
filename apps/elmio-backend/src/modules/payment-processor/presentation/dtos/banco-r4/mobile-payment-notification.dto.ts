import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

// DTO para recibir la notificación de pago completado (MBconsulta)
export class MobilePaymentNotificationR4Dto {
  @IsString()
  @IsNotEmpty()
  IdComercio: string; // ID del comercio

  @IsString()
  @IsNotEmpty()
  TelefonoComercio: string; // Teléfono del comercio - 11 numérico

  @IsString()
  @IsNotEmpty()
  TelefonoEmisor: string; // Teléfono de quien envió el pago (ej: V13536733)

  @IsString()
  @IsNotEmpty()
  Concepto: string; // Concepto del pago (ej: "PAGO MOVIL.")

  @IsString()
  @IsNotEmpty()
  BancoEmisor: string; // Código del banco emisor (ej: "134")

  @IsString()
  @IsNotEmpty()
  Monto: string; // Monto del pago

  @IsDateString()
  @IsNotEmpty()
  FechaHora: string; // Fecha y hora de la transacción (ISO 8601)

  @IsString()
  @IsNotEmpty()
  Referencia: string; // Número de referencia de la transacción

  @IsString()
  @IsNotEmpty()
  CodigoRed: string; // Código de red (ej: "00")
}

// DTO para la respuesta que envías a R4
export class MobilePaymentNotificationR4ResponseDto {
  abono: boolean; // true = pago registrado correctamente
}
