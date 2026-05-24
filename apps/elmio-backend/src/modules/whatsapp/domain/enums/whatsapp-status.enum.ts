/**
 * Estados posibles del cliente de WhatsApp.
 */
export enum WhatsAppStatus {
  /** Desconectado — no hay sesion activa. */
  DISCONNECTED = 'DISCONNECTED',
  /** Esperando escaneo de QR por parte del administrador. */
  QR_PENDING = 'QR_PENDING',
  /** Proceso de autenticacion en curso. */
  AUTHENTICATING = 'AUTHENTICATING',
  /** Conectado y listo para enviar mensajes. */
  READY = 'READY',
  /** Error en la conexion. */
  ERROR = 'ERROR',
}
