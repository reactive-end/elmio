import { Module } from '@nestjs/common';
import { GalleryModule } from './modules/gallery/gallery.module';
import { HealthModule } from './modules/health/health.module';

/**
 * Modulo raiz de la aplicacion NestJS.
 * Importa y orquesta todos los modulos de feature.
 */
@Module({
  imports: [HealthModule, GalleryModule],
})
export class AppModule {}
