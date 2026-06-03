import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  RBAC_REPOSITORY_PORT,
  type RbacRepositoryPort,
  type EnrichedUser,
} from '@/modules/rbac/domain/ports/rbac-repository.port';
import type { UserEntity } from '@/modules/auth/infrastructure/entities/user.entity';
import { UserRole } from '@/modules/auth/domain/user';

export interface ListUsersInput {
  role: string;
  page: number;
  perPage: number;
  search?: string;
  includeInactive?: boolean;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role: string;
  passwordHash: string;
  slug?: string;
  phone?: string;
  countryCode?: string;
  owner?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: string;
  slug?: string;
  phone?: string;
  countryCode?: string;
  isActive?: boolean;
}

/**
 * Gestiona el listado, creacion, edicion y eliminacion logica de usuarios.
 */
@Injectable()
export class ManageUsersUseCase {
  constructor(
    @Inject(RBAC_REPOSITORY_PORT)
    private readonly repository: RbacRepositoryPort,
  ) {}

  async list(input: ListUsersInput) {
    const { role, page, perPage, search, includeInactive } = input;
    if (page < 1 || perPage < 1 || perPage > 100) {
      throw new BadRequestException(
        'Pagina y perPage deben ser mayores a 0. perPage maximo 100.',
      );
    }

    const result = await this.repository.listUsersByRole({
      role,
      page,
      perPage,
      search,
      includeInactive,
    });

    return {
      items: result.items.map((u) => this.stripUser(u)),
      total: result.total,
      page,
      perPage,
      totalPages: Math.ceil(result.total / perPage),
    };
  }

  async findById(id: string): Promise<ReturnType<typeof this.stripUser>> {
    const user = await this.repository.findUserById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    return this.stripUser(user);
  }

  async create(input: CreateUserInput): Promise<ReturnType<typeof this.stripUser>> {
    const user = await this.repository.createUser({
      name: input.name,
      email: input.email,
      role: input.role as UserRole,
      passwordHash: input.passwordHash,
      slug: input.slug ?? null,
      phone: input.phone ?? '',
      countryCode: input.countryCode ?? '+58',
      owner: input.owner ?? 'admin',
    });
    return this.stripUser(user);
  }

  async update(
    id: string,
    input: UpdateUserInput,
  ): Promise<ReturnType<typeof this.stripUser>> {
    const existing = await this.repository.findUserById(id);
    if (!existing) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const user = await this.repository.updateUser(id, {
      name: input.name,
      email: input.email,
      role: input.role as UserRole | undefined,
      slug: input.slug,
      phone: input.phone,
      countryCode: input.countryCode,
      isActive: input.isActive,
    });
    return this.stripUser(user);
  }

  async deactivate(id: string): Promise<void> {
    const existing = await this.repository.findUserById(id);
    if (!existing) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    await this.repository.deactivateUser(id);
  }

  private stripUser(user: UserEntity | EnrichedUser) {
    const rawPhone =
      (user as EnrichedUser).profilePhone ||
      (user as EnrichedUser).enterprisePhone ||
      user.phone ||
      '';
    const cc = user.countryCode || '+58';

    const displayPhone =
      rawPhone && !rawPhone.startsWith('+')
        ? `${cc}${rawPhone}`
        : rawPhone;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      slug: user.slug,
      phone: displayPhone,
      countryCode: user.countryCode,
      owner: user.owner,
      isActive: user.isActive,
      requirePasswordChange: user.requirePasswordChange,
      createdAt: user.createdAt,
    };
  }
}
