import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ValidateSessionUseCase } from '../../application/validate-session.use-case';
import type { UserSession } from '../../domain/user';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      session?: UserSession;
    }
  }
}

/**
 * Guard NestJS que extrae y valida el token de sesion del header Authorization.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly validateSessionUseCase: ValidateSessionUseCase,
  ) {}

  /**
   * Extrae el token del header y valida la sesion.
   * @param context Contexto de ejecucion de NestJS.
   * @returns true si la sesion es valida.
   * @throws UnauthorizedException si no hay token o es invalido.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticacion requerido.');
    }

    const token = header.slice(7);
    const session = this.validateSessionUseCase.execute(token);

    request.session = session;

    return true;
  }
}
