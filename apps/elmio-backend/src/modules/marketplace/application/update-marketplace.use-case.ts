import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Marketplace } from '../domain/marketplace';
import {
  MARKETPLACE_REPOSITORY_PORT,
  type MarketplaceRepositoryPort,
} from '../domain/ports/marketplace-repository.port';

/**
 * Caso de uso que actualiza la configuracion completa de un marketplace.
 * Conectado con el boton "Guardar" del editor frontend.
 */
@Injectable()
export class UpdateMarketplaceUseCase {
  constructor(
    @Inject(MARKETPLACE_REPOSITORY_PORT)
    private readonly repository: MarketplaceRepositoryPort,
  ) {}

  /**
   * Reemplaza la configuracion completa de un marketplace existente.
   * @param id Identificador del marketplace.
   * @param marketplace Datos completos actualizados desde el editor.
   * @returns Marketplace actualizado.
   * @throws NotFoundException si el marketplace no existe.
   */
  async execute(
    id: string,
    marketplace: Marketplace,
    isAdmin = false,
  ): Promise<Marketplace> {
    const existente = await this.repository.findById(id);

    if (!existente) {
      throw new NotFoundException(`Marketplace con id "${id}" no encontrado.`);
    }

    const updatedMarketplace = { ...marketplace };
    if (isAdmin) {
      updatedMarketplace.owner = existente.owner;
    }

    // Si esta configuracion se marca como activa, desactivar otras del mismo slug
    if (updatedMarketplace.active) {
      const todos = await this.repository.list();
      const otrosMismosSlug = todos.filter(
        (m) =>
          m.slug.toLowerCase() === existente.slug.toLowerCase() &&
          m.id !== id &&
          m.active,
      );
      for (const otro of otrosMismosSlug) {
        otro.active = false;
        await this.repository.update(otro.id, otro);
      }
    }

    return this.repository.update(id, updatedMarketplace);
  }
}
