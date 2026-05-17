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
  async execute(id: string, marketplace: Marketplace): Promise<Marketplace> {
    const existente = await this.repository.findById(id);

    if (!existente) {
      throw new NotFoundException(`Marketplace con id "${id}" no encontrado.`);
    }

    return this.repository.update(id, marketplace);
  }
}
