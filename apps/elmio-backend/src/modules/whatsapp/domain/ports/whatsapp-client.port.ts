import type { Observable } from 'rxjs';
import type { WhatsAppStatusInfo } from '../types/whatsapp-status-info';

export const WHATSAPP_CLIENT_PORT = Symbol('WHATSAPP_CLIENT_PORT');

/**
 * Puerto del dominio para el cliente de WhatsApp.
 * Define las operaciones disponibles para interactuar con WhatsApp.
 */
export interface WhatsAppClientPort {
  /** Envia un mensaje de texto a un numero de telefono. */
  sendMessage(phoneNumber: string, message: string): Promise<void>;

  /** Devuelve la informacion del estado actual del cliente. */
  getStatusInfo(): WhatsAppStatusInfo;

  /** Devuelve el QR como data URL (base64) o null si no hay QR disponible. */
  getQrDataUrl(): string | null;

  /** Cierra la sesion actual y elimina los datos de autenticacion. */
  logout(): Promise<void>;

  /** Reinicia el cliente de WhatsApp. */
  restart(): Promise<void>;

  /** Devuelve un Observable SSE con actualizaciones de QR y estado. */
  getQrStream(): Observable<MessageEvent>;
}
