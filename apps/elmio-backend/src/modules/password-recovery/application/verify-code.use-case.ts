import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AUTH_REPOSITORY_PORT } from '../../auth/domain/ports/auth-repository.port';
import type { AuthRepositoryPort } from '../../auth/domain/ports/auth-repository.port';
import { RECOVERY_CODE_REPOSITORY_PORT } from '../domain/ports/recovery-code-repository.port';
import type { RecoveryCodeRepositoryPort } from '../domain/ports/recovery-code-repository.port';
import { hashPassword } from '../../auth/helpers';

export interface VerifyCodeResult {
  resetToken: string;
}

/**
 * Caso de uso para verificar un codigo de recuperacion provisto por el usuario.
 * Si es valido, invalida todos los codigos del usuario y genera un JWT temporal
 * de 5 minutos para autorizar el cambio de contrasena.
 */
@Injectable()
export class VerifyCodeUseCase {
  private readonly logger = new Logger(VerifyCodeUseCase.name);

  constructor(
    @Inject(AUTH_REPOSITORY_PORT)
    private readonly authRepository: AuthRepositoryPort,
    @Inject(RECOVERY_CODE_REPOSITORY_PORT)
    private readonly recoveryCodeRepository: RecoveryCodeRepositoryPort,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Ejecuta la verificacion del codigo OTP.
   * @param email - Correo del usuario.
   * @param code - Codigo OTP ingresado.
   * @returns Token temporal de reseteo.
   * @throws BadRequestException si el codigo o el usuario no son validos.
   */
  async execute(email: string, code: string): Promise<VerifyCodeResult> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      this.logger.warn(`Intento de verificacion de codigo para email inexistente: ${email}`);
      throw new BadRequestException('Código inválido o expirado.');
    }

    const hashedCode = hashPassword(code);
    const validCode = await this.recoveryCodeRepository.findValidCode(
      user.id,
      hashedCode,
    );

    if (!validCode) {
      this.logger.warn(`Codigo OTP invalido o expirado para usuario: ${user.id}`);
      throw new BadRequestException('Código inválido o expirado.');
    }

    // Invalidar todos los codigos activos del usuario para que sea de un unico uso
    await this.recoveryCodeRepository.invalidateAllForUser(user.id);

    // Generar JWT temporal con duracion de 5 minutos
    const resetToken = this.jwtService.sign(
      {
        sub: user.id,
        type: 'password-reset',
      },
      {
        expiresIn: '5m',
      },
    );

    this.logger.log(`Codigo verificado exitosamente para usuario: ${user.id}. Token temporal generado.`);

    return { resetToken };
  }
}
