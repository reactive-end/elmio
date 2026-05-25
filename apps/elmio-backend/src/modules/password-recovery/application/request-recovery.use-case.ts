import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { randomInt, randomUUID } from 'node:crypto';
import { AUTH_REPOSITORY_PORT } from '../../auth/domain/ports/auth-repository.port';
import type { AuthRepositoryPort } from '../../auth/domain/ports/auth-repository.port';
import { RECOVERY_CODE_REPOSITORY_PORT } from '../domain/ports/recovery-code-repository.port';
import type { RecoveryCodeRepositoryPort } from '../domain/ports/recovery-code-repository.port';
import { NOTIFICATION_SENDER_PORT } from '../../notification/domain/ports/notification-sender.port';
import type { NotificationSenderPort } from '../../notification/domain/ports/notification-sender.port';
import { hashPassword } from '../../auth/helpers';
import type { RecoveryCode } from '../domain/types/recovery-code';
import { PersonProfileEntity } from '../../enterprise/infrastructure/entities/person-profile.entity';

export interface RequestRecoveryResult {
  channel: 'whatsapp' | 'email';
  message: string;
}

/**
 * Caso de uso para solicitar un codigo de recuperacion de contrasena.
 * Busca el usuario, invalida codigos anteriores, genera un codigo OTP de 6 digitos,
 * lo persiste hasheado y lo envia via WhatsApp (con fallback a Email).
 */
@Injectable()
export class RequestRecoveryUseCase {
  private readonly logger = new Logger(RequestRecoveryUseCase.name);

  constructor(
    @Inject(AUTH_REPOSITORY_PORT)
    private readonly authRepository: AuthRepositoryPort,
    @Inject(RECOVERY_CODE_REPOSITORY_PORT)
    private readonly recoveryCodeRepository: RecoveryCodeRepositoryPort,
    @Inject(NOTIFICATION_SENDER_PORT)
    private readonly notificationSender: NotificationSenderPort,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Ejecuta el flujo de solicitud de recuperacion de contrasena de forma segura.
   * @param email - Correo electronico provisto por el usuario.
   * @returns Mensaje generico para evitar la enumeracion de cuentas.
   */
  async execute(email: string): Promise<RequestRecoveryResult> {
    const defaultResponse: RequestRecoveryResult = {
      channel: 'email',
      message: 'Si el correo está registrado, recibirás un código de recuperación.',
    };

    try {
      const user = await this.authRepository.findByEmail(email);
      if (!user) {
        this.logger.warn(`Solicitud de recuperacion para email inexistente: ${email}`);
        return defaultResponse;
      }

      // Obtener el numero de telefono del usuario desde person_profiles
      const profile = await this.dataSource
        .getRepository(PersonProfileEntity)
        .findOne({ where: { userId: user.id } });

      const phone = profile ? profile.phone : undefined;

      // Invalidar todos los codigos previos del usuario
      await this.recoveryCodeRepository.invalidateAllForUser(user.id);

      // Generar codigo OTP de 6 digitos
      const plainCode = randomInt(100000, 999999).toString();
      const hashedCode = hashPassword(plainCode);

      // Calcular expiracion
      const expiryMinutes = this.configService.get<number>(
        'RECOVERY_CODE_EXPIRY_MINUTES',
        10,
      );
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      // Persistir el codigo en BD
      const recoveryCode: RecoveryCode = {
        id: randomUUID(),
        userId: user.id,
        codeHash: hashedCode,
        expiresAt,
        used: false,
        createdAt: new Date().toISOString(),
      };

      await this.recoveryCodeRepository.save(recoveryCode);

      // Enviar notificacion (NotificationService gestionara WhatsApp vs Email fallback)
      const result = await this.notificationSender.sendRecoveryCode(
        {
          email: user.email,
          name: user.name,
          phone,
        },
        plainCode,
      );

      return {
        channel: result.channel,
        message: defaultResponse.message,
      };
    } catch (error) {
      this.logger.error(`Error en caso de uso RequestRecoveryUseCase: ${String(error)}`);
      return defaultResponse;
    }
  }
}
