import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserSession } from '../../domain/user';

/**
 * Decorador que extrae la sesion del usuario autenticado del request.
 * Usar en parametros de controlador: @CurrentUser() session: UserSession.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserSession => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.session as UserSession;
  },
);
