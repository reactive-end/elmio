import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Product } from '../domain/product';
import {
  PRODUCT_REPOSITORY_PORT,
  type ProductRepositoryPort,
} from '../domain/ports/product-repository.port';

/**
 * Caso de uso para listar y buscar productos.
 */
@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly repository: ProductRepositoryPort,
  ) {}

  async execute(): Promise<Product[]> {
    return this.repository.list();
  }
}

/**
 * Caso de uso para obtener un producto por su ID.
 */
@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly repository: ProductRepositoryPort,
  ) {}

  async execute(id: string): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product) throw new NotFoundException('Producto no encontrado.');
    return product;
  }
}

/**
 * Caso de uso para eliminar un producto.
 */
@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly repository: ProductRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundException('Producto no encontrado.');
  }
}
