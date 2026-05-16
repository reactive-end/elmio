import type { HealthStatus } from '../health-status';

/** Token de inyeccion para el puerto de verificacion de salud. */
export const HEALTH_CHECK_PORT = Symbol('HEALTH_CHECK_PORT');

/** Puerto que define la operacion de verificacion de salud del sistema. */
export interface HealthCheckPort {
  /**
   * Verifica el estado de salud del sistema.
   * @returns Estado actual en formato {@link HealthStatus}.
   */
  check(): Promise<HealthStatus>;
}
