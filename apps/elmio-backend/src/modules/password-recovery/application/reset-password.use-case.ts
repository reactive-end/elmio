import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AUTH_REPOSITORY_PORT } from '../../auth/domain/ports/auth-repository.port';
import type { AuthRepositoryPort } from '../../auth/domain/ports/auth-repository.port';
import { RECOVERY_CODE_REPOSITORY_PORT } from '../domain/ports/recovery-code-repository.port';
import type { RecoveryCodeRepositoryPort } from '../domain/ports/recovery-code-repository.port';
import { hashPassword } from '../../auth/helpers';

interface ResetPasswordPayload {
  sub: string;
  type: string;
}

export interface ResetPasswordResult {
  message: string;
}

/**
 * Caso de uso para restablecer la contrasena del usuario.
 * Valida el JWT temporal de reseteo, actualiza la contrasena en base de datos
 * e invalida cualquier codigo de recuperacion pendiente.
 */
@Injectable()
export class ResetPasswordUseCase {
  private readonly logger = new Logger(ResetPasswordUseCase.name);

  constructor(
    @Inject(AUTH_REPOSITORY_PORT)
    private readonly authRepository: AuthRepositoryPort,
    @Inject(RECOVERY_CODE_REPOSITORY_PORT)
    private readonly recoveryCodeRepository: RecoveryCodeRepositoryPort,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Ejecuta el restablecimiento de contrasena.
   * @param token - Token temporal JWT obtenido en la verificacion.
   * @param newPassword - Nueva contrasena elegida por el usuario.
   * @returns Mensaje de operacion exitosa.
   * @throws BadRequestException si el token es invalido, expirado o de tipo incorrecto.
   */
  async execute(token: string, newPassword: string): Promise<ResetPasswordResult> {
    try {
      const payload = this.jwtService.verify<ResetPasswordPayload>(token);

      if (payload.type !== 'password-reset') {
        this.logger.warn(`Token de tipo invalido recibido en reset-password: ${payload.type}`);
        throw new BadRequestException('Token inválido.');
      }

      // Hashear la nueva contrasena
      const newHash = hashPassword(newPassword);

      // Actualizar contrasena del usuario en base de datos
      await this.authRepository.updatePassword(payload.sub, newHash);

      // Asegurarse de invalidar codigos residuales
      await this.recoveryCodeRepository.invalidateAllForUser(payload.sub);

      this.logger.log(`Contrasena actualizada exitosamente para usuario: ${payload.sub}`);

      return {
        message: 'Contraseña actualizada exitosamente.',
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error al verificar token de recuperacion: ${String(error)}`);
      throw new BadRequestException('Token inválido o expirado.');
    }
  }
}
