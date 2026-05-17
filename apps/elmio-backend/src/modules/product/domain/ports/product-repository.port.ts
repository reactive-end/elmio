import type { Product } from '../product';

export const PRODUCT_REPOSITORY_PORT = Symbol('PRODUCT_REPOSITORY_PORT');

/**
 * Puerto del dominio para persistir y consultar productos.
 */
export interface ProductRepositoryPort {
  /**
   * Lista todos los productos activos.
   */
  list(): Promise<Product[]>;

  /**
   * Busca un producto por su ID.
   */
  findById(id: string): Promise<Product | null>;

  /**
   * Busca un producto por su SKU.
   */
  findBySku(sku: string): Promise<Product | null>;

  /**
   * Lista productos de un marketplace especifico.
   */
  findByMarketplace(marketplaceId: string): Promise<Product[]>;

  /**
   * Crea o actualiza un producto.
   */
  save(product: Product): Promise<Product>;

  /**
   * Elimina un producto por su ID.
   */
  delete(id: string): Promise<boolean>;
}
