import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { UserRole } from '../../domain/user';
import { ROLES_KEY } from './roles.decorator';
import { RBAC_GROUP_KEY } from './rbac-group.decorator';

/**
 * Guard NestJS que verifica si el usuario autenticado posee
 * alguno de los roles requeridos por el endpoint.
 * Debe usarse después de AuthGuard para que `request.session` esté disponible.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Evalúa si el usuario tiene uno de los roles requeridos.
   * Si no se definieron roles con el decorador @Roles, permite el acceso.
   * @param context - Contexto de ejecución de NestJS.
   * @returns `true` si no hay roles requeridos o el rol del usuario está incluido.
   */
  canActivate(context: ExecutionContext): boolean {
    const groupKey = this.reflector.getAllAndOverride<string | undefined>(
      RBAC_GROUP_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (groupKey) {
      return true; // Delegar al guard global RbacGroupGuard
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const session = request.session;

    if (!session) {
      return false;
    }

    return requiredRoles.includes(session.role as UserRole);
  }
}
