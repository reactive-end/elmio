import { Inject, Injectable } from '@nestjs/common';
import type { HealthStatus } from '../domain/health-status';
import {
  HEALTH_CHECK_PORT,
  type HealthCheckPort,
} from '../domain/ports/health-check.port';

/**
 * Caso de uso que orquesta la verificacion de salud del sistema.
 * Delega en el puerto {@link HealthCheckPort} para obtener el estado.
 */
@Injectable()
export class GetHealthUseCase {
  constructor(
    @Inject(HEALTH_CHECK_PORT)
    private readonly healthCheckPort: HealthCheckPort,
  ) {}

  /**
   * Ejecuta la verificacion de salud.
   * @returns Promesa con el estado de salud del sistema.
   */
  execute(): Promise<HealthStatus> {
    return this.healthCheckPort.check();
  }
}
