import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { UserSession } from '../domain/user';
import {
  AUTH_REPOSITORY_PORT,
  type AuthRepositoryPort,
} from '../domain/ports/auth-repository.port';
import { hashPassword } from '../helpers';

interface LoginInput {
  email: string;
  password: string;
  userId?: string;
}

interface LoginOutput {
  token?: string;
  user?: UserSession;
  multipleProfiles?: boolean;
  profiles?: Array<{
    userId: string;
    name: string;
    role: any;
  }>;
}

/**
 * Caso de uso que autentica un usuario y genera un token de sesion.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY_PORT)
    private readonly repository: AuthRepositoryPort,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Valida credenciales y genera un token de sesion.
   * @param input Email y password del usuario.
   * @returns Token de sesion y datos del usuario, o un listado de perfiles si son multiples.
   */
  async execute(input: LoginInput): Promise<LoginOutput> {
    if (!input.email?.trim() || !input.password?.trim()) {
      throw new BadRequestException('Email y password son obligatorios.');
    }

    const allUsers = await this.repository.findAllByEmail(
      input.email.trim().toLowerCase(),
    );

    if (allUsers.length === 0) {
      throw new UnauthorizedException('Credenciales invalidas.');
    }

    // Si hay múltiples perfiles para el mismo email o telefono, primero mostramos
    // el selector y la validacion de password ocurre sobre el perfil elegido.
    if (allUsers.length > 1 && !input.userId) {
      return {
        multipleProfiles: true,
        profiles: allUsers.map((u) => ({
          userId: u.id,
          name: u.name,
          role: u.role,
        })),
      };
    }

    let selectedUser = allUsers[0];

    // Si se especificó un userId, buscamos ese usuario en particular.
    if (input.userId) {
      const matched = allUsers.find((u) => u.id === input.userId);
      if (!matched) {
        throw new UnauthorizedException(
          'Perfil seleccionado inválido para las credenciales provistas.',
        );
      }
      selectedUser = matched;
    }

    const inputHash = hashPassword(input.password);

    if (selectedUser.passwordHash !== inputHash) {
      throw new UnauthorizedException(
        input.userId
          ? 'La contrasena no corresponde al perfil seleccionado.'
          : 'Credenciales invalidas.',
      );
    }

    const session: UserSession = {
      userId: selectedUser.id,
      email: selectedUser.email,
      role: selectedUser.role,
      owner: selectedUser.owner,
      requirePasswordChange: selectedUser.requirePasswordChange,
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
