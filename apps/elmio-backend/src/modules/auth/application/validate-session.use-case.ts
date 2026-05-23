import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { UserSession } from '../domain/user';
import type { UserRole } from '../domain/user';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  owner: string;
  requirePasswordChange?: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Caso de uso que valida un token JWT y devuelve los datos del usuario.
 * Usado por el AuthGuard en cada request protegido.
 */
@Injectable()
export class ValidateSessionUseCase {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Valida un token JWT y devuelve la sesion asociada.
   * @param token Token JWT del header Authorization.
   * @returns Datos de sesion del usuario.
   * @throws UnauthorizedException si el token es invalido o expiro.
   */
  async execute(token: string): Promise<UserSession> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      return {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        owner: payload.owner,
        requirePasswordChange: payload.requirePasswordChange,
      };
    } catch {
      throw new UnauthorizedException('Token de sesion invalido o expirado.');
    }
  }
}
