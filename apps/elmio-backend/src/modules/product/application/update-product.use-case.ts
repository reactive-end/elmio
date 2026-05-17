import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Product } from '../domain/product';
import {
  PRODUCT_REPOSITORY_PORT,
  type ProductRepositoryPort,
} from '../domain/ports/product-repository.port';

/**
 * Caso de uso para actualizar un producto existente.
 */
@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly repository: ProductRepositoryPort,
  ) {}

  async execute(id: string, updates: Partial<Product>): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product) throw new NotFoundException('Producto no encontrado.');

    const updated: Product = {
      ...product,
      ...updates,
      id: product.id,
      sku: product.sku,
      createdAt: product.createdAt,
      updatedAt: new Date().toISOString(),
    };

    return this.repository.save(updated);
  }
}
