import { Module } from '@nestjs/common';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { EmailService } from './infrastructure/email.service';
import { NotificationService } from './application/notification.service';
import { NOTIFICATION_SENDER_PORT } from './domain/ports/notification-sender.port';

/**
 * Modulo de notificaciones del sistema.
 * Provee el servicio de envio de notificaciones con estrategia
 * de fallback (WhatsApp -> Email) a traves del puerto NOTIFICATION_SENDER_PORT.
 */
@Module({
  imports: [WhatsAppModule],
  providers: [
    EmailService,
    NotificationService,
    {
      provide: NOTIFICATION_SENDER_PORT,
      useClass: NotificationService,
    },
  ],
  exports: [NOTIFICATION_SENDER_PORT],
})
export class NotificationModule {}
