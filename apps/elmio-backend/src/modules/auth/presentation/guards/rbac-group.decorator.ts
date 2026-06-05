import { SetMetadata } from '@nestjs/common';

export const RBAC_GROUP_KEY = 'rbac_group';

/**
 * Decorador que establece el grupo de permisos RBAC requerido para acceder a un endpoint.
 * Se usa en conjunto con RbacGroupGuard.
 * @param groupKey - La clave del grupo de permisos RBAC.
 */
export const RbacGroup = (groupKey: string) =>
  SetMetadata(RBAC_GROUP_KEY, groupKey);
