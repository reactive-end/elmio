/**
 * Puerto del dominio para persistir y consultar permisos RBAC.
 */
export const RBAC_REPOSITORY_PORT = Symbol('RBAC_REPOSITORY_PORT');

import type { RolePermission } from '../../domain/role-permission';
import type { UserEntity } from '../../../auth/infrastructure/entities/user.entity';

export interface RbacRepositoryPort {
  /** Obtiene todos los permisos configurados. */
  findAllPermissions(): Promise<RolePermission[]>;

  /** Guarda o actualiza un permiso (upsert por role + groupKey). */
  savePermission(permission: RolePermission): Promise<RolePermission>;

  /** Guarda varios permisos de golpe para un rol. */
  savePermissions(
    role: string,
    permissions: Array<{ groupKey: string; visible: boolean }>,
  ): Promise<RolePermission[]>;

  /** Lista usuarios paginados por rol, con búsqueda opcional. */
  listUsersByRole(params: {
    role: string;
    page: number;
    perPage: number;
    search?: string;
    includeInactive?: boolean;
  }): Promise<{ items: UserEntity[]; total: number }>;

  /** Busca un usuario por ID. */
  findUserById(id: string): Promise<UserEntity | null>;

  /** Crea un usuario. */
  createUser(data: Partial<UserEntity>): Promise<UserEntity>;

  /** Actualiza un usuario. */
  updateUser(id: string, data: Partial<UserEntity>): Promise<UserEntity>;

  /** Soft-delete: desactiva un usuario (isActive = false). */
  deactivateUser(id: string): Promise<void>;
}
