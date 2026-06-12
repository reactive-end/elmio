import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WHATSAPP_CLIENT_PORT,
  type WhatsAppClientPort,
} from '../../whatsapp/domain/ports/whatsapp-client.port';
import { WhatsAppStatus } from '../../whatsapp/domain/enums/whatsapp-status.enum';

export interface RecoveryAvailabilityResult {
  available: boolean;
  whatsappReady: boolean;
  emailConfigured: boolean;
}

/**
 * Caso de uso que evalua si el sistema de recuperacion de contrasena
 * puede operar. Retorna `available=true` solo si al menos uno de los
 * canales (WhatsApp READY o SMTP configurado) es viable.
 *
 * Pensado para ser consumido por el frontend antes de habilitar la
 * UI de "¿Olvidaste tu contrasena?" y mostrar un mensaje de indisponibilidad
 * si ambos canales fallan.
 */
@Injectable()
export class CheckRecoveryAvailabilityUseCase {
  constructor(
    @Inject(WHATSAPP_CLIENT_PORT)
    private readonly whatsAppClient: WhatsAppClientPort,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Evalua la disponibilidad actual de los canales de envio.
   * @returns Resultado con banderas individuales y un `available` agregado.
   */
  execute(): RecoveryAvailabilityResult {
    const whatsappReady =
      this.whatsAppClient.getStatusInfo().status === WhatsAppStatus.READY;

    const smtpHost = this.configService.get<string>('SMTP_HOST', '').trim();
    const smtpUser = this.configService.get<string>('SMTP_USER', '').trim();
    const smtpPass = this.configService.get<string>('SMTP_PASS', '').trim();
    const emailConfigured =
      smtpHost.length > 0 && smtpUser.length > 0 && smtpPass.length > 0;

    return {
      available: whatsappReady || emailConfigured,
      whatsappReady,
      emailConfigured,
    };
  }
}
