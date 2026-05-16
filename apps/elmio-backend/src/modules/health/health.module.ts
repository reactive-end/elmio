import { Module } from '@nestjs/common';
import { GetHealthUseCase } from './application/get-health.use-case';
import { HEALTH_CHECK_PORT } from './domain/ports/health-check.port';
import { RuntimeHealthService } from './infrastructure/runtime-health.service';
import { HealthController } from './presentation/http/health.controller';

/**
 * Modulo que agrupa la feature de salud.
 * Cablea el controlador HTTP, el caso de uso y la implementacion del puerto.
 */
@Module({
  controllers: [HealthController],
  providers: [
    GetHealthUseCase,
    RuntimeHealthService,
    {
      provide: HEALTH_CHECK_PORT,
      useExisting: RuntimeHealthService,
    },
  ],
})
export class HealthModule {}
