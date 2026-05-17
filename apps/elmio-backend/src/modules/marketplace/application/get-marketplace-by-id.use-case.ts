import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Marketplace } from '../domain/marketplace';
import {
  MARKETPLACE_REPOSITORY_PORT,
  type MarketplaceRepositoryPort,
} from '../domain/ports/marketplace-repository.port';

/**
 * Caso de uso que busca un marketplace por su ID.
 * Usado por el editor del dashboard para cargar configuracion.
 */
@Injectable()
export class GetMarketplaceByIdUseCase {
  constructor(
    @Inject(MARKETPLACE_REPOSITORY_PORT)
    private readonly repository: MarketplaceRepositoryPort,
  ) {}

  /**
   * Busca un marketplace por su identificador unico.
   * @param id Identificador del marketplace.
   * @returns Marketplace encontrado.
   * @throws NotFoundException si no existe.
   */
  async execute(id: string): Promise<Marketplace> {
    const marketplace = await this.repository.findById(id);

    if (!marketplace) {
      throw new NotFoundException(`Marketplace con id "${id}" no encontrado.`);
    }

    return marketplace;
  }
}
