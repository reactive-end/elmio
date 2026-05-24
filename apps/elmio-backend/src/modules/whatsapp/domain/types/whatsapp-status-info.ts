import type { WhatsAppStatus } from '../enums/whatsapp-status.enum';

/**
 * Informacion del estado actual del cliente de WhatsApp.
 */
export interface WhatsAppStatusInfo {
  status: WhatsAppStatus;
  hasQr: boolean;
  connectedPhone?: string;
}
