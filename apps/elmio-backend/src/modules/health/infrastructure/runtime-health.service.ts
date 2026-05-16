import { Injectable } from '@nestjs/common';
import type { HealthStatus } from '../domain/health-status';
import type { HealthCheckPort } from '../domain/ports/health-check.port';

/**
 * Implementacion en tiempo de ejecucion del puerto {@link HealthCheckPort}.
 * Responde siempre con un estado saludable mientras el proceso este activo.
 */
@Injectable()
export class RuntimeHealthService implements HealthCheckPort {
  /**
   * Verifica que el proceso de la API este corriendo.
   * @returns Promesa con estado `ok`.
   */
  check(): Promise<HealthStatus> {
    return Promise.resolve({ status: 'ok' });
  }
}
