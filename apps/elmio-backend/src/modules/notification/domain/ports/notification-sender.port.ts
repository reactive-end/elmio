import type { NotificationRecipient } from '../types/notification-recipient';
import type { NotificationResult } from '../types/notification-result';

export const NOTIFICATION_SENDER_PORT = Symbol('NOTIFICATION_SENDER_PORT');

/**
 * Puerto del dominio para enviar notificaciones.
 */
export interface NotificationSenderPort {
  /**
   * Envia un codigo de recuperacion al destinatario.
   * Intenta WhatsApp primero, si falla usa email como fallback.
   * @param recipient - Datos del destinatario.
   * @param code - Codigo OTP a enviar.
   * @returns Resultado del envio indicando el canal utilizado.
   */
  sendRecoveryCode(
    recipient: NotificationRecipient,
    code: string,
  ): Promise<NotificationResult>;
}
