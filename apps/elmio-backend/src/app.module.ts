import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { EnterpriseModule } from './modules/enterprise/enterprise.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { HealthModule } from './modules/health/health.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { ProductModule } from './modules/product/product.module';

/**
 * Modulo raiz de la aplicacion NestJS.
 * Importa y orquesta todos los modulos de feature.
 */
@Module({
  imports: [
    HealthModule,
    AuthModule,
    EnterpriseModule,
    GalleryModule,
    MarketplaceModule,
    ProductModule,
  ],
})
export class AppModule {}
