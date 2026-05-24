import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../domain/user';

export const ROLES_KEY = 'roles';

/**
 * Decorador que establece los roles requeridos para acceder a un endpoint.
 * Se usa en conjunto con RolesGuard.
 * @param roles - Roles permitidos para acceder al endpoint.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
