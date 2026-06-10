import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
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

    const normalizedEmail = input.email.trim().toLowerCase();

    // Buscamos todos los usuarios con el mismo email para soportar multi-perfil
    // (por ejemplo: un mismo correo que es EMPLOYEE de una empresa y ademas
    // quiere ser representante legal / COMPANY de otra).
    const existingUsers = await this.repository.findAllByEmail(normalizedEmail);

    // El sistema solo permite auto-registrarse como COMPANY o CLIENT. Si el email
    // ya esta registrado con un rol distinto, se permite agregar el nuevo perfil
    // (COMPANY/CLIENT) en coexistencia con el existente.
    if (existingUsers.length > 0) {
      const existingRoles = new Set<UserRole>(existingUsers.map((u) => u.role));
      if (existingRoles.has(input.role as UserRole)) {
        throw new ConflictException(
          `Ya existe un perfil ${input.role} asociado a este correo. Inicia sesion para continuar.`,
        );
      }

      // Seguridad: para crear un perfil adicional sobre un email ya registrado,
      // la contrasena del input debe coincidir con la del primer perfil existente.
      // Asi nos aseguramos de que la peticion viene del dueno real de la cuenta.
      const inputHash = hashPassword(input.password);
      const matchesAny = existingUsers.some(
        (u) => u.passwordHash === inputHash,
      );
      if (!matchesAny) {
        throw new UnauthorizedException(
          'La contrasena no coincide con la cuenta existente asociada a este correo.',
        );
      }

      // Reutilizamos el hash del primer perfil existente: la misma persona
      // comparte la misma contrasena en todos sus perfiles.
      const reusedPasswordHash = existingUsers[0].passwordHash;

      const user: User = {
        id: randomUUID(),
        name: input.name?.trim() ?? existingUsers[0].name,
        email: normalizedEmail,
        passwordHash: reusedPasswordHash,
        role: input.role as UserRole,
        owner: input.owner?.trim() ?? 'default',
        createdAt: new Date().toISOString(),
        requirePasswordChange: false,
      };

      const created = await this.repository.create(user);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...userWithoutPassword } = created;

      return userWithoutPassword;
    }

    const user: User = {
      id: randomUUID(),
      name: input.name?.trim() ?? '',
      email: normalizedEmail,
      passwordHash: hashPassword(input.password),
      role: input.role as UserRole,
      owner: input.owner?.trim() ?? 'default',
      createdAt: new Date().toISOString(),
    };

    const created = await this.repository.create(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = created;

    return userWithoutPassword;
  }
}
