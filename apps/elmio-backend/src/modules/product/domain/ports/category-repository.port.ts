import type { Category } from '../category';

export const CATEGORY_REPOSITORY_PORT = Symbol('CATEGORY_REPOSITORY_PORT');

/**
 * Puerto del dominio para persistir y consultar categorias de productos.
 */
export interface CategoryRepositoryPort {
  /**
   * Lista todas las categorias disponibles.
   */
  list(): Promise<Category[]>;

  /**
   * Busca una categoria por su ID.
   */
  findById(id: string): Promise<Category | null>;

  /**
   * Busca una categoria por su slug.
   */
  findBySlug(slug: string): Promise<Category | null>;

  /**
   * Registra una nueva categoria.
   */
  create(category: Category): Promise<Category>;

  /**
   * Modifica una categoria existente.
   */
  update(id: string, category: Category): Promise<Category>;

  /**
   * Elimina una categoria.
   */
  delete(id: string): Promise<boolean>;
}
