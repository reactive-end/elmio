import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { UserRole } from '../domain/user';
import {
  AUTH_REPOSITORY_PORT,
  type AuthRepositoryPort,
} from '../domain/ports/auth-repository.port';

export interface DiscoverProfilesOutput {
  profiles: Array<{
    userId: string;
    name: string;
    role: UserRole;
    email: string;
  }>;
}

/**
 * Caso de uso que resuelve los perfiles asociados a un correo o telefono
 * antes de solicitar la contrasena del perfil elegido.
 */
@Injectable()
export class DiscoverProfilesUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY_PORT)
    private readonly repository: AuthRepositoryPort,
  ) {}

  /**
   * Retorna todos los perfiles asociados al identificador recibido.
   * @param identifier Correo o telefono del usuario.
   * @returns Lista de perfiles encontrados.
   */
  async execute(identifier: string): Promise<DiscoverProfilesOutput> {
    if (!identifier?.trim()) {
      throw new BadRequestException('Correo o telefono es obligatorio.');
    }

    const users = await this.repository.findAllByEmail(identifier.trim().toLowerCase());

    if (users.length === 0) {
      throw new UnauthorizedException('No se encontraron perfiles asociados.');
    }

    return {
      profiles: users.map((user) => ({
        userId: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
      })),
    };
  }
}
