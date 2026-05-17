import { createHmac } from 'node:crypto';
import type { UserSession } from './domain/user';

/**
 * Hash de password usando HMAC-SHA256 con una clave fija del servidor.
 * En produccion esto debe reemplazarse por bcrypt o argon2.
 */
export function hashPassword(password: string): string {
  return createHmac('sha256', 'elmio-secret-key')
    .update(password)
    .digest('hex');
}

/**
 * Almacen en memoria de tokens de sesion activos.
 * Mapea token (UUID) -> UserSession.
 */
export const tokenStore = new Map<string, UserSession>();
