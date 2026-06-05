import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { type User, UserRole } from '../domain/user';
import {
  AUTH_REPOSITORY_PORT,
  type AuthRepositoryPort,
} from '../domain/ports/auth-repository.port';
import { hashPassword } from '../helpers';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: 'COMPANY' | 'CLIENT';
  owner: string;
}

/**
 * Caso de uso que registra un nuevo usuario.
 * Solo permite registro de COMPANY o CLIENT. Los EMPLOYEE se crean
 * desde el modulo enterprise.
 */
@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY_PORT)
    private readonly repository: AuthRepositoryPort,
  ) {}

  /**
   * Registra un nuevo usuario con email y password.
   * @param input Datos de registro del usuario.
   * @returns Usuario creado (sin password).
   */
  async execute(input: RegisterInput): Promise<Omit<User, 'passwordHash'>> {
    if (!input.email?.trim() || !input.password?.trim()) {
      throw new BadRequestException('Email y password son obligatorios.');
    }

    const validRoles: string[] = [UserRole.COMPANY, UserRole.CLIENT];
    if (!validRoles.includes(input.role)) {
      throw new BadRequestException(
        'Rol invalido. Solo COMPANY o CLIENT permitidos.',
      );
    }

    const existing = await this.repository.findByEmail(
      input.email.trim().toLowerCase(),
    );

    if (existing) {
      throw new ConflictException('El email ya esta registrado.');
    }

    const user: User = {
      id: randomUUID(),
      name: input.name?.trim() ?? '',
      email: input.email.trim().toLowerCase(),
      passwordHash: hashPassword(input.password),
      role: input.role,
      owner: input.owner?.trim() ?? 'default',
      createdAt: new Date().toISOString(),
    };

    const created = await this.repository.create(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = created;

    return userWithoutPassword;
  }
}
