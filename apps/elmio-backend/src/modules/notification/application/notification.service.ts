import { Inject, Injectable, Logger } from '@nestjs/common';
import type { NotificationSenderPort } from '../domain/ports/notification-sender.port';
import type { NotificationRecipient } from '../domain/types/notification-recipient';
import type { NotificationResult } from '../domain/types/notification-result';
import { WHATSAPP_CLIENT_PORT } from '../../whatsapp/domain/ports/whatsapp-client.port';
import type { WhatsAppClientPort } from '../../whatsapp/domain/ports/whatsapp-client.port';
import { WhatsAppStatus } from '../../whatsapp/domain/enums/whatsapp-status.enum';
import { EmailService } from '../infrastructure/email.service';

/**
 * Servicio de aplicacion que implementa el envio de notificaciones.
 * Utiliza una estrategia de fallback: intenta WhatsApp primero y,
 * si no esta disponible o falla, recurre al correo electronico.
 */
@Injectable()
export class NotificationService implements NotificationSenderPort {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(WHATSAPP_CLIENT_PORT)
    private readonly whatsAppClient: WhatsAppClientPort,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Envia un codigo de recuperacion al destinatario.
   * Intenta WhatsApp primero si el destinatario tiene telefono y el servicio esta listo.
   * Si WhatsApp no esta disponible o falla, utiliza email como fallback.
   * @param recipient - Datos del destinatario (email, nombre, telefono opcional).
   * @param code - Codigo OTP de 6 digitos a enviar.
   * @returns Resultado del envio indicando exito, canal utilizado y posible error.
   */
  async sendRecoveryCode(
    recipient: NotificationRecipient,
    code: string,
  ): Promise<NotificationResult> {
    const whatsappAvailable =
      !!recipient.phone &&
      this.whatsAppClient.getStatusInfo().status === WhatsAppStatus.READY;

    if (whatsappAvailable && recipient.phone) {
      try {
        const message =
          `🔐 *ElMio* - Código de recuperación\n\n` +
          `Tu código es: *${code}*\n\n` +
          `Este código expira en 10 minutos.\n` +
          `Si no solicitaste esto, ignora este mensaje.`;

        await this.whatsAppClient.sendMessage(recipient.phone, message);
        this.logger.log(
          `Codigo de recuperacion enviado por WhatsApp a ${recipient.phone}`,
        );

        return { success: true, channel: 'whatsapp' };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido en WhatsApp';
        this.logger.warn(
          `Fallo envio por WhatsApp a ${recipient.phone}: ${errorMessage}. Intentando por email...`,
        );
      }
    }

    return this.sendViaEmail(recipient, code);
  }

  /**
   * Envia el codigo de recuperacion por correo electronico.
   * @param recipient - Datos del destinatario.
   * @param code - Codigo OTP a enviar.
   * @returns Resultado del envio por email.
   */
  private async sendViaEmail(
    recipient: NotificationRecipient,
    code: string,
  ): Promise<NotificationResult> {
    try {
      await this.emailService.sendRecoveryEmail(
        recipient.email,
        recipient.name,
        code,
      );
      this.logger.log(
        `Codigo de recuperacion enviado por email a ${recipient.email}`,
      );

      return { success: true, channel: 'email' };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido en email';
      this.logger.error(
        `Fallo envio por email a ${recipient.email}: ${errorMessage}`,
      );

      return { success: false, channel: 'email', error: errorMessage };
    }
  }
}
