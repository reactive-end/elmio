import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ListMarketplacesUseCase } from './application/list-marketplaces.use-case';
import { GetMarketplaceBySlugUseCase } from './application/get-marketplace-by-slug.use-case';
import { GetMarketplaceByIdUseCase } from './application/get-marketplace-by-id.use-case';
import { CreateMarketplaceUseCase } from './application/create-marketplace.use-case';
import { UpdateMarketplaceUseCase } from './application/update-marketplace.use-case';
import { DeleteMarketplaceUseCase } from './application/delete-marketplace.use-case';
import { MARKETPLACE_REPOSITORY_PORT } from './domain/ports/marketplace-repository.port';
import { DbMarketplaceRepositoryService } from './infrastructure/db-marketplace-repository.service';
import { MarketplaceEntity } from './infrastructure/entities/marketplace.entity';
import { MarketplaceController } from './presentation/http/marketplace.controller';
import { MarketplaceSeedService } from './infrastructure/marketplace-seed.service';

/**
 * Modulo que agrupa la feature de configuracion de marketplaces.
 * Sigue arquitectura hexagonal: domain, application, infrastructure, presentation.
 */
@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([MarketplaceEntity]),
  ],
  controllers: [MarketplaceController],
  providers: [
    ListMarketplacesUseCase,
    GetMarketplaceBySlugUseCase,
    GetMarketplaceByIdUseCase,
    CreateMarketplaceUseCase,
    UpdateMarketplaceUseCase,
    DeleteMarketplaceUseCase,
    DbMarketplaceRepositoryService,
    MarketplaceSeedService,
    {
      provide: MARKETPLACE_REPOSITORY_PORT,
      useClass: DbMarketplaceRepositoryService,
    },
  ],
})
export class MarketplaceModule {}

