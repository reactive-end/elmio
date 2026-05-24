import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  type WASocket,
  type ConnectionState,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import * as QRCode from 'qrcode';
import { rm } from 'fs/promises';
import { Subject, type Observable } from 'rxjs';
import { WhatsAppStatus } from '../domain/enums/whatsapp-status.enum';
import type { WhatsAppClientPort } from '../domain/ports/whatsapp-client.port';
import type { WhatsAppStatusInfo } from '../domain/types/whatsapp-status-info';

/**
 * Implementacion del cliente de WhatsApp usando Baileys.
 * Gestiona la conexion, autenticacion via QR, envio de mensajes
 * y streaming SSE del estado/QR hacia el frontend.
 */
@Injectable()
export class BaileysWhatsAppService
  implements WhatsAppClientPort, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(BaileysWhatsAppService.name);
  private readonly sessionPath: string;
  private readonly qrSubject = new Subject<MessageEvent>();

  private socket: WASocket | null = null;
  private currentStatus: WhatsAppStatus = WhatsAppStatus.DISCONNECTED;
  private currentQrDataUrl: string | null = null;
  private connectedPhone: string | undefined;
  private isConnecting = false;

  constructor(private readonly configService: ConfigService) {
    this.sessionPath = this.configService.get<string>(
      'WHATSAPP_SESSION_PATH',
      './whatsapp-session',
    );
  }

  /** Inicializa la conexion al arrancar el modulo. */
  async onModuleInit(): Promise<void> {
    await this.initSocket();
  }

  /** Cierra la conexion al destruir el modulo. */
  async onModuleDestroy(): Promise<void> {
    this.closeSocket();
  }

  /**
   * Envia un mensaje de texto a un numero de telefono via WhatsApp.
   * @param phoneNumber Numero con codigo de pais (ej: +5491234567890 o 5491234567890).
   * @param message Texto del mensaje a enviar.
   * @throws Error si el cliente no esta conectado.
   */
  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    if (!this.socket || this.currentStatus !== WhatsAppStatus.READY) {
      throw new Error(
        'El cliente de WhatsApp no esta conectado. Estado actual: ' +
          this.currentStatus,
      );
    }

    const jid = this.formatPhoneToJid(phoneNumber);
    await this.socket.sendMessage(jid, { text: message });
    this.logger.log(`Mensaje enviado a ${jid}`);
  }

  /**
   * Devuelve la informacion del estado actual del cliente.
   * @returns Objeto con status, hasQr y connectedPhone.
   */
  getStatusInfo(): WhatsAppStatusInfo {
    return {
      status: this.currentStatus,
      hasQr: this.currentQrDataUrl !== null,
      connectedPhone: this.connectedPhone,
    };
  }

  /**
   * Devuelve el codigo QR como data URL (base64) para mostrarlo en el frontend.
   * @returns Data URL del QR o null si no hay QR disponible.
   */
  getQrDataUrl(): string | null {
    return this.currentQrDataUrl;
  }

  /**
   * Cierra la sesion, elimina los datos de autenticacion persistidos
   * y reinicia el socket para generar un nuevo QR.
   */
  async logout(): Promise<void> {
    this.logger.log('Cerrando sesion de WhatsApp...');
    this.closeSocket();

    try {
      await rm(this.sessionPath, { recursive: true, force: true });
      this.logger.log('Datos de sesion eliminados.');
    } catch (error) {
      this.logger.warn(
        `No se pudieron eliminar los datos de sesion: ${String(error)}`,
      );
    }

    this.currentQrDataUrl = null;
    this.connectedPhone = undefined;
    this.updateStatus(WhatsAppStatus.DISCONNECTED);

    await this.initSocket();
  }

  /**
   * Reinicia el cliente cerrando la conexion actual y reconectando.
   */
  async restart(): Promise<void> {
    this.logger.log('Reiniciando cliente de WhatsApp...');
    this.closeSocket();
    this.currentQrDataUrl = null;
    this.updateStatus(WhatsAppStatus.DISCONNECTED);
    await this.initSocket();
  }

  /**
   * Devuelve un Observable SSE con eventos de QR y cambios de estado.
   * @returns Observable de MessageEvent para streaming SSE.
   */
  getQrStream(): Observable<MessageEvent> {
    return this.qrSubject.asObservable();
  }

  private async initSocket(): Promise<void> {
    if (this.isConnecting) {
      this.logger.warn('Ya se está inicializando una conexión de WhatsApp. Ignorando llamada duplicada.');
      return;
    }

    try {
      this.isConnecting = true;
      this.updateStatus(WhatsAppStatus.AUTHENTICATING);

      const { state, saveCreds } = await useMultiFileAuthState(
        this.sessionPath,
      );

      const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }) as ReturnType<typeof pino>,
        printQRInTerminal: false,
      });

      this.socket = sock;
      this.setupConnectionListener(sock, saveCreds);
      this.setupCredsListener(sock, saveCreds);

      this.logger.log('Socket de WhatsApp inicializado.');
    } catch (error) {
      this.logger.error(
        `Error al inicializar el socket: ${String(error)}`,
      );
      this.updateStatus(WhatsAppStatus.ERROR);
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Configura el listener de actualizaciones de conexion.
   * Maneja QR, estados de conexion y desconexion.
   */
  private setupConnectionListener(
    sock: WASocket,
    saveCreds: () => Promise<void>,
  ): void {
    sock.ev.on(
      'connection.update',
      async (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          await this.handleQrUpdate(qr);
        }

        if (connection === 'open') {
          this.handleConnectionOpen(sock);
        }

        if (connection === 'close') {
          await this.handleConnectionClose(lastDisconnect, saveCreds);
        }
      },
    );
  }

  /**
   * Configura el listener para persistir credenciales.
   */
  private setupCredsListener(
    sock: WASocket,
    saveCreds: () => Promise<void>,
  ): void {
    sock.ev.on('creds.update', saveCreds);
  }

  /**
   * Procesa la actualizacion del codigo QR.
   * Lo convierte a data URL y lo emite via SSE.
   */
  private async handleQrUpdate(qr: string): Promise<void> {
    try {
      this.currentQrDataUrl = await QRCode.toDataURL(qr);
      this.updateStatus(WhatsAppStatus.QR_PENDING);

      this.qrSubject.next({
        data: JSON.stringify({
          type: 'qr',
          qr: this.currentQrDataUrl,
        }),
      } as MessageEvent);

      this.logger.log('Nuevo codigo QR generado.');
    } catch (error) {
      this.logger.error(`Error al generar QR data URL: ${String(error)}`);
    }
  }

  /**
   * Maneja la conexion exitosa al servidor de WhatsApp.
   */
  private handleConnectionOpen(sock: WASocket): void {
    this.currentQrDataUrl = null;
    this.connectedPhone = sock.user?.id?.split(':')[0] ?? undefined;
    this.updateStatus(WhatsAppStatus.READY);
    this.logger.log(
      `WhatsApp conectado. Telefono: ${this.connectedPhone ?? 'desconocido'}`,
    );
  }

  /**
   * Maneja el cierre de conexion y decide si reconectar o limpiar sesion.
   */
  private async handleConnectionClose(
    lastDisconnect: ConnectionState['lastDisconnect'],
    _saveCreds: () => Promise<void>,
  ): Promise<void> {
    const statusCode = (
      lastDisconnect?.error as { output?: { statusCode?: number } }
    )?.output?.statusCode;

    this.logger.warn(`Conexión cerrada. Código de estado: ${statusCode ?? 'desconocido'}`);

    // Limpiamos siempre el socket huérfano para evitar colisiones concurrentes
    this.closeSocket();

    if (statusCode === DisconnectReason.loggedOut) {
      this.logger.warn(
        'Sesión cerrada por el servidor. Limpiando datos de sesión local...',
      );
      this.currentQrDataUrl = null;
      this.connectedPhone = undefined;

      try {
        await rm(this.sessionPath, { recursive: true, force: true });
        this.logger.log('Archivos de autenticación eliminados con éxito.');
      } catch (error) {
        this.logger.warn(
          `No se pudieron eliminar los archivos de sesión: ${String(error)}`,
        );
      }

      this.updateStatus(WhatsAppStatus.DISCONNECTED);
      await this.initSocket();
    } else {
      // Intentamos reconectar con un delay de 3 segundos para evitar loops infinitos (especialmente código 440)
      this.logger.warn('Reintentando conexión en 3 segundos...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await this.initSocket();
    }
  }

  /**
   * Actualiza el estado actual y lo emite via SSE.
   */
  private updateStatus(status: WhatsAppStatus): void {
    this.currentStatus = status;

    this.qrSubject.next({
      data: JSON.stringify({
        type: 'status',
        status: this.currentStatus,
      }),
    } as MessageEvent);
  }

  /**
   * Cierra el socket de WhatsApp si esta activo y remueve listeners.
   */
  private closeSocket(): void {
    if (this.socket) {
      try {
        this.socket.ev.removeAllListeners('connection.update');
        this.socket.ev.removeAllListeners('creds.update');
        this.socket.end(undefined);
      } catch (error) {
        this.logger.warn(`Error al cerrar socket anterior: ${String(error)}`);
      }
      this.socket = null;
    }
  }

  /**
   * Formatea un numero de telefono a JID de WhatsApp.
   * Elimina el signo + y agrega @s.whatsapp.net.
   * @param phoneNumber Numero con o sin el prefijo +.
   * @returns JID formateado (ej: 5491234567890@s.whatsapp.net).
   */
  private formatPhoneToJid(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\+/g, '').replace(/\s/g, '');
    return `${cleaned}@s.whatsapp.net`;
  }
}
