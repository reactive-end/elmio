import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WHATSAPP_CLIENT_PORT } from './domain/ports/whatsapp-client.port';
import { BaileysWhatsAppService } from './infrastructure/baileys-whatsapp.service';
import { WhatsAppAdminController } from './presentation/whatsapp-admin.controller';

/**
 * Modulo de WhatsApp.
 * Integra el cliente de WhatsApp usando Baileys y expone
 * endpoints de administracion para gestionar la conexion.
 */
@Module({
  imports: [AuthModule],
  controllers: [WhatsAppAdminController],
  providers: [
    {
      provide: WHATSAPP_CLIENT_PORT,
      useClass: BaileysWhatsAppService,
    },
  ],
  exports: [WHATSAPP_CLIENT_PORT],
})
export class WhatsAppModule {}
