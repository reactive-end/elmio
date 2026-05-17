import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { UserSession } from '../domain/user';
import { tokenStore } from '../helpers';

/**
 * Caso de uso que valida un token de sesion y devuelve los datos del usuario.
 * Usado por el AuthGuard en cada request protegido.
 */
@Injectable()
export class ValidateSessionUseCase {
  /**
   * Valida un token y devuelve la sesion asociada.
   * @param token Token de sesion del header Authorization.
   * @returns Datos de sesion del usuario.
   * @throws UnauthorizedException si el token es invalido.
   */
  execute(token: string): UserSession {
    const session = tokenStore.get(token);

    if (!session) {
      throw new UnauthorizedException('Token de sesion invalido o expirado.');
    }

    return session;
  }
}
