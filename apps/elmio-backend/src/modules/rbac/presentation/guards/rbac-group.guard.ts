import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RBAC_GROUP_KEY } from '@/modules/auth/presentation/guards/rbac-group.decorator';
import { UserRole } from '@/modules/auth/domain/user';
import { ManagePermissionsUseCase } from '../../application/manage-permissions.use-case';

/**
 * Guard global que verifica si el rol del usuario autenticado tiene acceso
 * al grupo de permisos configurado en el endpoint mediante @RbacGroup.
 */
@Injectable()
export class RbacGroupGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly managePermissionsUseCase: ManagePermissionsUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. ¿Tiene @RbacGroup?
    const groupKey = this.reflector.getAllAndOverride<string | undefined>(
      RBAC_GROUP_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!groupKey) {
      return true;
    }

    // 2. ¿Hay sesión?
    const request = context.switchToHttp().getRequest<Request>();
    const session = request.session;

    if (!session) {
      // Si no hay sesión, permitimos que el AuthGuard maneje la falta de autenticación
      return true;
    }

    // 3. ¿Role === ADMIN?
    if ((session.role as UserRole) === UserRole.ADMIN) {
      return true;
    }

    // 4. Consultar permisos resueltos del usuario (con overrides y cache)
    const userPermissions = await this.managePermissionsUseCase.resolveForUser(
      session.userId,
      session.role,
    );

    // 5. ¿Permiso configurado?
    if (userPermissions[groupKey] === undefined) {
      // Regla de Seguridad:
      // - Roles del Sistema: Open-by-default (retorna true para no romper flujos del core)
      // - Roles Dinámicos: Closed-by-default (lanza ForbiddenException)
      const isSystemRole = Object.values(UserRole).includes(
        session.role as UserRole,
      );
      if (isSystemRole) {
        return true;
      }
      throw new ForbiddenException(
        `No tienes permiso para acceder a este recurso (${groupKey})`,
      );
    }

    // 6. ¿visible === true?
    if (userPermissions[groupKey] === true) {
      return true;
    }

    // 7. Si está configurado como false, lanzamos ForbiddenException
    throw new ForbiddenException(
      `No tienes permiso para acceder a este recurso (${groupKey})`,
    );
  }
}
