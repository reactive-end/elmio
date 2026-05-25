import {
  Controller,
  Get,
  Inject,
  Post,
  Sse,
  UseGuards,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/guards/roles.decorator';
import { UserRole } from '../../auth/domain/user';
import {
  WHATSAPP_CLIENT_PORT,
  type WhatsAppClientPort,
} from '../domain/ports/whatsapp-client.port';
import type { WhatsAppStatusInfo } from '../domain/types/whatsapp-status-info';

/**
 * Controlador de administracion de WhatsApp.
 * Solo accesible por usuarios con rol ADMIN.
 * Permite gestionar la conexion, visualizar el QR y controlar el servicio.
 */
@Controller('whatsapp')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class WhatsAppAdminController {
  constructor(
    @Inject(WHATSAPP_CLIENT_PORT)
    private readonly whatsAppClient: WhatsAppClientPort,
  ) {}

  /**
   * Obtiene el estado actual del cliente de WhatsApp.
   * `GET /api/whatsapp/admin/status`
   * @returns Informacion del estado incluyendo si hay QR y el telefono conectado.
   */
  @Get('status')
  getStatus(): WhatsAppStatusInfo {
    return this.whatsAppClient.getStatusInfo();
  }

  /**
   * Obtiene el codigo QR como data URL para vincular un dispositivo.
   * `GET /api/whatsapp/admin/qr`
   * @returns Objeto con la data URL del QR o null si no hay QR disponible.
   */
  @Get('qr')
  getQr(): { qr: string | null } {
    return { qr: this.whatsAppClient.getQrDataUrl() };
  }

  /**
   * Stream SSE que emite actualizaciones en tiempo real del QR y estado.
   * `GET /api/whatsapp/admin/qr-stream`
   * @returns Observable de MessageEvent con eventos de tipo 'qr' y 'status'.
   */
  @Sse('qr-stream')
  getQrStream(): Observable<MessageEvent> {
    return this.whatsAppClient.getQrStream();
  }

  /**
   * Cierra la sesion de WhatsApp y elimina los datos de autenticacion.
   * `POST /api/whatsapp/admin/logout`
   * @returns Mensaje de confirmacion.
   */
  @Post('logout')
  async logout(): Promise<{ message: string }> {
    await this.whatsAppClient.logout();
    return { message: 'Sesion de WhatsApp cerrada exitosamente.' };
  }

  /**
   * Reinicia el cliente de WhatsApp cerrando y reconectando.
   * `POST /api/whatsapp/admin/restart`
   * @returns Mensaje de confirmacion.
   */
  @Post('restart')
  async restart(): Promise<{ message: string }> {
    await this.whatsAppClient.restart();
    return { message: 'Cliente de WhatsApp reiniciado exitosamente.' };
  }
}
