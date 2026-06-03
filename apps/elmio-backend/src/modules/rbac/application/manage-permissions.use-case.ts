import { Inject, Injectable } from '@nestjs/common';
import {
  RBAC_REPOSITORY_PORT,
  type RbacRepositoryPort,
} from '@/modules/rbac/domain/ports/rbac-repository.port';
import type { RolePermission } from '@/modules/rbac/domain/role-permission';

export interface SavePermissionsInput {
  role: string;
  permissions: Array<{ groupKey: string; visible: boolean }>;
}

/**
 * Gestiona la configuracion de visibilidad de la sidebar por rol.
 */
@Injectable()
export class ManagePermissionsUseCase {
  constructor(
    @Inject(RBAC_REPOSITORY_PORT)
    private readonly repository: RbacRepositoryPort,
  ) {}

  /** Devuelve todos los permisos configurados, agrupados por rol. */
  async getAll(): Promise<Record<string, Record<string, boolean>>> {
    const perms = await this.repository.findAllPermissions();
    const grouped: Record<string, Record<string, boolean>> = {};
    for (const p of perms) {
      if (!grouped[p.role]) {
        grouped[p.role] = {};
      }
      grouped[p.role][p.groupKey] = p.visible;
    }
    return grouped;
  }

  /** Guarda la configuracion de visibilidad para un rol. */
  async save(input: SavePermissionsInput): Promise<RolePermission[]> {
    return this.repository.savePermissions(input.role, input.permissions);
  }
}
