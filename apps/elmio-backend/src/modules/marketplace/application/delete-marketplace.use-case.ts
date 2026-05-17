import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  MARKETPLACE_REPOSITORY_PORT,
  type MarketplaceRepositoryPort,
} from '../domain/ports/marketplace-repository.port';

/**
 * Caso de uso que elimina un marketplace del sistema.
 */
@Injectable()
export class DeleteMarketplaceUseCase {
  constructor(
    @Inject(MARKETPLACE_REPOSITORY_PORT)
    private readonly repository: MarketplaceRepositoryPort,
  ) {}

  /**
   * Elimina un marketplace por su identificador.
   * @param id Identificador del marketplace a eliminar.
   * @throws NotFoundException si el marketplace no existe.
   */
  async execute(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new NotFoundException(`Marketplace con id "${id}" no encontrado.`);
    }
  }
}
