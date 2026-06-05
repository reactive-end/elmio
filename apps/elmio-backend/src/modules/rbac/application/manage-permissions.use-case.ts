import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import {
  RBAC_REPOSITORY_PORT,
  type RbacRepositoryPort,
} from '@/modules/rbac/domain/ports/rbac-repository.port';
import type { RolePermission } from '@/modules/rbac/domain/role-permission';
import type { UserPermission } from '@/modules/rbac/domain/user-permission';
import { UserRole } from '@/modules/auth/domain/user';

export interface SavePermissionsInput {
  role: string;
  permissions: Array<{ groupKey: string; visible: boolean }>;
}

/**
 * Gestiona la configuracion de visibilidad de la sidebar por rol.
 */
@Injectable()
export class ManagePermissionsUseCase {
  private cachedPermissions: Record<string, Record<string, boolean>> | null =
    null;
  private cacheExpiresAt = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

  constructor(
    @Inject(RBAC_REPOSITORY_PORT)
    private readonly repository: RbacRepositoryPort,
  ) {}

  /** Devuelve todos los permisos configurados, agrupados por rol. */
  async getAll(): Promise<Record<string, Record<string, boolean>>> {
    const now = Date.now();
    if (this.cachedPermissions && now < this.cacheExpiresAt) {
      return this.cachedPermissions;
    }

    const perms = await this.repository.findAllPermissions();
    const grouped: Record<string, Record<string, boolean>> = {};
    for (const p of perms) {
      if (!grouped[p.role]) {
        grouped[p.role] = {};
      }
      grouped[p.role][p.groupKey] = p.visible;
    }

    this.cachedPermissions = grouped;
    this.cacheExpiresAt = now + this.CACHE_TTL_MS;
    return grouped;
  }

  /** Guarda la configuracion de visibilidad para un rol. */
  async save(input: SavePermissionsInput): Promise<RolePermission[]> {
    const result = await this.repository.savePermissions(
      input.role,
      input.permissions,
    );
    this.invalidateCache();
    return result;
  }

  /** Invalida la caché de permisos en memoria. */
  invalidateCache(): void {
    this.cachedPermissions = null;
    this.cacheExpiresAt = 0;
    // También limpiamos la caché de usuarios por seguridad al cambiar un rol global
    this.cachedUserPermissions = {};
    this.cachedUserExpiresAt = {};
  }

  // Caché de permisos por usuario
  private cachedUserPermissions: Record<string, Record<string, boolean>> = {};
  private cachedUserExpiresAt: Record<string, number> = {};

  /** Obtiene y resuelve los permisos consolidados de un usuario específico. */
  async resolveForUser(
    userId: string,
    role: string,
  ): Promise<Record<string, boolean>> {
    const now = Date.now();
    if (
      this.cachedUserPermissions[userId] &&
      now < this.cachedUserExpiresAt[userId]
    ) {
      return this.cachedUserPermissions[userId];
    }

    // 1. Obtener los permisos del rol
    const rolePermissions = (await this.getAll())[role] || {};

    // 2. Obtener los overrides del usuario
    const userOverrides = await this.repository.findUserPermissions(userId);

    // 3. Combinar: el override de usuario tiene prioridad
    const resolved: Record<string, boolean> = { ...rolePermissions };
    for (const override of userOverrides) {
      resolved[override.groupKey] = override.visible;
    }

    // Guardar en caché
    this.cachedUserPermissions[userId] = resolved;
    this.cachedUserExpiresAt[userId] = now + this.CACHE_TTL_MS;

    return resolved;
  }

  /** Devuelve la lista detallada de permisos (heredados vs overrides) para la UI de gestión de un usuario. */
  async getDetailedUserPermissions(
    userId: string,
    role: string,
  ): Promise<ResolvedUserPermission[]> {
    const rolePermissions = (await this.getAll())[role] || {};
    const userOverrides = await this.repository.findUserPermissions(userId);

    const overrideMap = new Map(
      userOverrides.map((o) => [o.groupKey, o.visible]),
    );
    const allKeys = new Set([
      ...Object.keys(rolePermissions),
      ...overrideMap.keys(),
    ]);

    // Usar una lista por defecto de groupKeys si el rol es dinámico y está vacío
    // para que la interfaz pueda mostrar los toggles de todos modos
    const defaultGroupKeys = [
      'products-list',
      'products-new',
      'marketplaces',
      'gallery-library',
      'enterprise-onboarding',
      'enterprise-account',
      'enterprise-collaborators',
      'enterprise-requests',
      'enterprise-contracts',
      'finance-requests',
      'finance-purchases',
      'config-whatsapp',
      'config-enterprise-interest-rates',
      'config-allies',
      'config-rbac',
      'config-bank-accounts',
      'config-currencies',
      'config-finance-users',
    ];

    for (const key of defaultGroupKeys) {
      allKeys.add(key);
    }

    return Array.from(allKeys).map((groupKey) => {
      const isOverride = overrideMap.has(groupKey);
      const visible = isOverride
        ? overrideMap.get(groupKey)!
        : (rolePermissions[groupKey] ?? true);
      return {
        groupKey,
        visible,
        isOverride,
        inheritedFromRole: rolePermissions[groupKey] ?? true,
      };
    });
  }

  /** Guarda los overrides del usuario e invalida su caché. */
  async saveUserOverrides(
    userId: string,
    permissions: Array<{ groupKey: string; visible: boolean }>,
  ): Promise<UserPermission[]> {
    const result = await this.repository.saveUserPermissions(
      userId,
      permissions,
    );
    this.invalidateUserCache(userId);
    return result;
  }

  /** Invalida la caché de permisos de un usuario específico. */
  invalidateUserCache(userId: string): void {
    delete this.cachedUserPermissions[userId];
    delete this.cachedUserExpiresAt[userId];
  }

  /** Devuelve la lista de roles del sistema y dinámicos creados. */
  async getRolesList(): Promise<
    Array<{ key: string; name: string; isSystem: boolean }>
  > {
    const systemRoles = [
      { key: UserRole.ADMIN, name: 'Administrador', isSystem: true },
      { key: UserRole.COMPANY, name: 'Empresa', isSystem: true },
      { key: UserRole.EMPLOYEE, name: 'Empleado', isSystem: true },
      { key: UserRole.CLIENT, name: 'Persona Natural', isSystem: true },
      { key: UserRole.ALLIED, name: 'Aliado', isSystem: true },
      { key: UserRole.FINANCE, name: 'Finanzas', isSystem: true },
    ];

    const customRoles = await this.repository.findCustomRoles();
    const customList = customRoles.map((cr) => ({
      key: cr.key,
      name: cr.name,
      isSystem: false,
    }));

    return [...systemRoles, ...customList];
  }

  /** Registra un nuevo rol dinámico personalizado. */
  async createCustomRole(name: string): Promise<{ key: string; name: string }> {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new BadRequestException('El nombre del rol es requerido.');
    }

    // Ej: "Soporte Técnico" -> "SUPPORT_TECHNICAL"
    const key = normalizedName
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]/g, '_')
      .substring(0, 50);

    // Evitar conflictos con roles de sistema
    if (Object.values(UserRole).includes(key as UserRole)) {
      throw new BadRequestException(
        'El nombre del rol coincide con un rol reservado del sistema.',
      );
    }

    // Verificar si ya existe en custom roles
    const existing = await this.repository.findCustomRoles();
    if (existing.some((r) => r.key === key)) {
      throw new BadRequestException('El rol ya existe.');
    }

    const result = await this.repository.createCustomRole(key, normalizedName);
    this.invalidateCache(); // Limpiar caché global
    return result;
  }

  /** Elimina un rol dinámico. */
  async deleteCustomRole(key: string): Promise<void> {
    // Verificar si es rol de sistema
    if (Object.values(UserRole).includes(key as UserRole)) {
      throw new BadRequestException(
        'No se pueden eliminar roles reservados del sistema.',
      );
    }

    await this.repository.deleteCustomRole(key);
    this.invalidateCache(); // Limpiar caché global
  }
}

export interface ResolvedUserPermission {
  groupKey: string;
  visible: boolean;
  isOverride: boolean;
  inheritedFromRole: boolean;
}
