import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Marketplace } from '../domain/marketplace';
import {
  MARKETPLACE_REPOSITORY_PORT,
  type MarketplaceRepositoryPort,
} from '../domain/ports/marketplace-repository.port';

/**
 * Caso de uso que busca un marketplace por su slug.
 * Usado por el renderizador publico para cargar la config de la landing.
 */
@Injectable()
export class GetMarketplaceBySlugUseCase {
  constructor(
    @Inject(MARKETPLACE_REPOSITORY_PORT)
    private readonly repository: MarketplaceRepositoryPort,
  ) {}

  /**
   * Busca un marketplace activo por su slug unico.
   * @param slug Slug del marketplace a buscar.
   * @returns Marketplace encontrado.
   * @throws NotFoundException si no existe o esta inactivo.
   */
  async execute(slug: string): Promise<Marketplace> {
    const marketplace = await this.repository.findBySlug(slug);

    if (!marketplace) {
      throw new NotFoundException(
        `Marketplace con slug "${slug}" no encontrado.`,
      );
    }

    return marketplace;
  }
}
