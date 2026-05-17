import { Inject, Injectable } from '@nestjs/common';
import type { Marketplace } from '../domain/marketplace';
import {
  MARKETPLACE_REPOSITORY_PORT,
  type MarketplaceRepositoryPort,
} from '../domain/ports/marketplace-repository.port';

/**
 * Caso de uso que lista todos los marketplaces existentes.
 */
@Injectable()
export class ListMarketplacesUseCase {
  constructor(
    @Inject(MARKETPLACE_REPOSITORY_PORT)
    private readonly repository: MarketplaceRepositoryPort,
  ) {}

  /**
   * Recupera todos los marketplaces del sistema.
   * @returns Coleccion de marketplaces.
   */
  async execute(): Promise<Marketplace[]> {
    return this.repository.list();
  }
}
