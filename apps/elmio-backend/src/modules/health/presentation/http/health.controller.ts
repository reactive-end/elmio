import { Controller, Get } from '@nestjs/common';
import { GetHealthUseCase } from '../../application/get-health.use-case';
import type { HealthStatus } from '../../domain/health-status';

/**
 * Controlador HTTP que expone el endpoint de salud de la API.
 * Adapta peticiones HTTP al caso de uso {@link GetHealthUseCase}.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly getHealthUseCase: GetHealthUseCase) {}

  /**
   * Endpoint de verificacion de salud del sistema.
   * `GET /api/health`
   * @returns Estado de salud del sistema.
   */
  @Get()
  getHealth(): Promise<HealthStatus> {
    return this.getHealthUseCase.execute();
  }
}
