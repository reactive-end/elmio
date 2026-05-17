import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { UserSession } from '../domain/user';
import {
  AUTH_REPOSITORY_PORT,
  type AuthRepositoryPort,
} from '../domain/ports/auth-repository.port';
import { hashPassword, tokenStore } from '../helpers';

interface LoginInput {
  email: string;
  password: string;
}

interface LoginOutput {
  token: string;
  user: UserSession;
}

/**
 * Caso de uso que autentica un usuario y genera un token de sesion.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY_PORT)
    private readonly repository: AuthRepositoryPort,
  ) {}

  /**
   * Valida credenciales y genera un token de sesion.
   * @param input Email y password del usuario.
   * @returns Token de sesion y datos del usuario.
   */
  async execute(input: LoginInput): Promise<LoginOutput> {
    if (!input.email?.trim() || !input.password?.trim()) {
      throw new BadRequestException('Email y password son obligatorios.');
    }

    const user = await this.repository.findByEmail(
      input.email.trim().toLowerCase(),
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas.');
    }

    const inputHash = hashPassword(input.password);

    if (inputHash !== user.passwordHash) {
      throw new UnauthorizedException('Credenciales invalidas.');
    }

    const token = randomUUID();
    const session: UserSession = {
      userId: user.id,
      email: user.email,
      role: user.role,
      owner: user.owner,
    };

    tokenStore.set(token, session);

    return { token, user: session };
  }
}
