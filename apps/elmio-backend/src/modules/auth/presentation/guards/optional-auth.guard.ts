import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
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
 * Guard NestJS que extrae y valida el token JWT del header Authorization de forma opcional.
 * Si no hay token o es inválido, permite continuar sin poblar request.session.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private readonly validateSessionUseCase: ValidateSessionUseCase,
  ) {}

  /**
   * Extrae el token del header y valida la sesion de forma opcional.
   * @param context Contexto de ejecucion de NestJS.
   * @returns Promise<true> siempre, poblando o no la sesion en el request.
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
      return true;
    }

    try {
      const session = await this.validateSessionUseCase.execute(token);
      request.session = session;
    } catch {
      // En caso de que el token sea inválido, continuamos de forma anónima
    }

    return true;
  }
}
