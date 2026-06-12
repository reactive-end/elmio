import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class DoneApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const expectedApiKey = process.env.DONE_API_KEY?.trim();

    if (!expectedApiKey) {
      throw new UnauthorizedException('Configuracion de API key no disponible');
    }

    const rawApiKey =
      request.headers?.['x-api-key'] ??
      request.headers?.['apikey'] ??
      request.headers?.['api-key'] ??
      request.query?.apiKey ??
      request.query?.apikey;

    const providedApiKey = Array.isArray(rawApiKey) ? rawApiKey[0] : rawApiKey;

    if (!providedApiKey || String(providedApiKey).trim() !== expectedApiKey) {
      throw new UnauthorizedException('API key invalida');
    }

    return true;
  }
}
