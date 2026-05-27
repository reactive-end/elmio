import { Injectable, OnApplicationBootstrap, Logger, Inject } from '@nestjs/common';
import {
  MARKETPLACE_REPOSITORY_PORT,
  type MarketplaceRepositoryPort,
} from '../domain/ports/marketplace-repository.port';
import type { Marketplace } from '../domain/marketplace';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class MarketplaceSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MarketplaceSeedService.name);

  constructor(
    @Inject(MARKETPLACE_REPOSITORY_PORT)
    private readonly repository: MarketplaceRepositoryPort,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedMainMarketplace();
  }

  private async seedMainMarketplace(): Promise<void> {
    const slug = 'elmio';
    try {
      const existing = await this.repository.findBySlug(slug);

      if (!existing) {
        // Buscar el marketplace-default.json en múltiples rutas posibles según el entorno (dev/QA/prod)
        const rootDir = process.cwd();
        const possiblePaths = [
          path.join(__dirname, 'data', 'marketplace-default.json'),
          path.join(__dirname, '..', 'data', 'marketplace-default.json'),
          path.join(rootDir, 'marketplace-default.json'),
          path.join(rootDir, 'apps', 'elmio-backend', 'src', 'modules', 'marketplace', 'infrastructure', 'data', 'marketplace-default.json'),
        ];

        let jsonPath = '';
        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            jsonPath = p;
            break;
          }
        }

        if (!jsonPath) {
          this.logger.error(
            `No se encontró el archivo JSON del marketplace default en ninguna de las rutas intentadas: ${JSON.stringify(possiblePaths, null, 2)}`,
          );
          return;
        }

        const mainMarketplace = JSON.parse(
          fs.readFileSync(jsonPath, 'utf8'),
        ) as Marketplace;

        await this.repository.create(mainMarketplace);
        this.logger.log(`Sembrado exitoso de marketplace principal predeterminado ('${slug}')`);
      }
    } catch (err) {
      this.logger.warn(`No se pudo sembrar el marketplace principal: ${(err as Error).message}`);
    }
  }
}
