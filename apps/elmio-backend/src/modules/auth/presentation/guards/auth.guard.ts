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
 * Guard NestJS que extrae y valida el token JWT del header Authorization.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly validateSessionUseCase: ValidateSessionUseCase,
  ) {}

  /**
   * Extrae el token del header y valida la sesion.
   * @param context Contexto de ejecucion de NestJS.
   * @returns Promise<true> si la sesion es valida.
   * @throws UnauthorizedException si no hay token o es invalido.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    let token: string | undefined;
    const header = request.headers.authorization;

    if (header?.startsWith('Bearer ')) {
      token = header.slice(7);
    } else if (request.query.token) {
      token = String(request.query.token);
    }

    if (!token) {
      throw new UnauthorizedException('Token de autenticacion requerido.');
    }

    const session = await this.validateSessionUseCase.execute(token);

    request.session = session;

    return true;
  }
}
