import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ListMarketplacesUseCase } from './application/list-marketplaces.use-case';
import { GetMarketplaceBySlugUseCase } from './application/get-marketplace-by-slug.use-case';
import { GetMarketplaceByIdUseCase } from './application/get-marketplace-by-id.use-case';
import { CreateMarketplaceUseCase } from './application/create-marketplace.use-case';
import { UpdateMarketplaceUseCase } from './application/update-marketplace.use-case';
import { DeleteMarketplaceUseCase } from './application/delete-marketplace.use-case';
import { MARKETPLACE_REPOSITORY_PORT } from './domain/ports/marketplace-repository.port';
import { FileMarketplaceRepositoryService } from './infrastructure/file-marketplace-repository.service';
import { MarketplaceController } from './presentation/http/marketplace.controller';

/**
 * Modulo que agrupa la feature de configuracion de marketplaces.
 * Sigue arquitectura hexagonal: domain, application, infrastructure, presentation.
 */
@Module({
  imports: [AuthModule],
  controllers: [MarketplaceController],
  providers: [
    ListMarketplacesUseCase,
    GetMarketplaceBySlugUseCase,
    GetMarketplaceByIdUseCase,
    CreateMarketplaceUseCase,
    UpdateMarketplaceUseCase,
    DeleteMarketplaceUseCase,
    FileMarketplaceRepositoryService,
    {
      provide: MARKETPLACE_REPOSITORY_PORT,
      useExisting: FileMarketplaceRepositoryService,
    },
  ],
})
export class MarketplaceModule {}
