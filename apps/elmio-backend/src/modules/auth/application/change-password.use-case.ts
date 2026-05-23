import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '../domain/user';
import type { UserSession } from '../domain/user';
import {
  AUTH_REPOSITORY_PORT,
  type AuthRepositoryPort,
} from '../domain/ports/auth-repository.port';
import { hashPassword } from '../helpers';

export interface ChangePasswordOutput {
  token: string;
  user: UserSession;
}

/**
 * Caso de uso que permite a un usuario autenticado cambiar su password.
 * Omite la password actual cuando el usuario esta en su primer inicio de sesion
 * con requirePasswordChange activo.
 */
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY_PORT)
    private readonly repository: AuthRepositoryPort,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Verifica la password actual cuando aplica, hashea la nueva y actualiza el usuario.
   * Marca requirePasswordChange como false.
   *
   * @param userId ID del usuario autenticado.
   * @param currentPassword Password actual para verificacion opcional.
   * @param newPassword Nueva password a establecer.
   * @returns Usuario actualizado.
   * @throws UnauthorizedException si la password actual es incorrecta.
   * @throws BadRequestException si la nueva password es menor a 8 caracteres.
   */
  async execute(
    userId: string,
    currentPassword: string | undefined,
    newPassword: string,
  ): Promise<ChangePasswordOutput> {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException(
        'La nueva contrasena debe tener al menos 8 caracteres.',
      );
    }

    const user = await this.repository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (!user.requirePasswordChange) {
      if (!currentPassword) {
        throw new BadRequestException('La contrasena actual es requerida.');
      }

      const currentHash = hashPassword(currentPassword);
      if (currentHash !== user.passwordHash) {
        throw new UnauthorizedException('La contrasena actual es incorrecta.');
      }
    }

    const newHash = hashPassword(newPassword);
    const updatedUser: User = await this.repository.updatePassword(
      userId,
      newHash,
    );

    const session: UserSession = {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      owner: updatedUser.owner,
      requirePasswordChange: updatedUser.requirePasswordChange,
    };

    const token = await this.jwtService.signAsync({
      sub: session.userId,
      email: session.email,
      role: session.role,
      owner: session.owner,
      requirePasswordChange: session.requirePasswordChange,
    });

    return { token, user: session };
  }
}
