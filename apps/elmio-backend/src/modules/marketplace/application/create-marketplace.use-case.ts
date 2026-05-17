import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Marketplace } from '../domain/marketplace';
import {
  MARKETPLACE_REPOSITORY_PORT,
  type MarketplaceRepositoryPort,
} from '../domain/ports/marketplace-repository.port';

interface CreateMarketplaceInput {
  name: string;
  slug: string;
  description: string;
  owner: string;
  logo: string;
}

/**
 * Caso de uso que crea un nuevo marketplace con configuracion inicial vacia.
 */
@Injectable()
export class CreateMarketplaceUseCase {
  constructor(
    @Inject(MARKETPLACE_REPOSITORY_PORT)
    private readonly repository: MarketplaceRepositoryPort,
  ) {}

  /**
   * Crea un marketplace con valores iniciales por defecto.
   * @param input Datos basicos del nuevo marketplace.
   * @returns Marketplace creado con ID y configuracion inicial.
   */
  async execute(input: CreateMarketplaceInput): Promise<Marketplace> {
    if (!input.name?.trim()) {
      throw new BadRequestException(
        'El nombre del marketplace es obligatorio.',
      );
    }

    if (!input.slug?.trim()) {
      throw new BadRequestException('El slug del marketplace es obligatorio.');
    }

    const existing = await this.repository.findBySlug(
      input.slug.trim().toLowerCase(),
    );

    if (existing) {
      throw new BadRequestException(`El slug "${input.slug}" ya esta en uso.`);
    }

    const marketplace: Marketplace = {
      id: randomUUID(),
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      description: input.description?.trim() ?? '',
      active: true,
      owner: input.owner?.trim() ?? '',
      logo: input.logo?.trim() ?? '',
      theme: {
        primaryColor: '#0f4ece',
        secondaryColor: '#13ce99',
        font: 'Inter',
      },
      sections: [],
    };

    return this.repository.create(marketplace);
  }
}
