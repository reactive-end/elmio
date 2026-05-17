import type { Marketplace } from '../marketplace';

export const MARKETPLACE_REPOSITORY_PORT = Symbol(
  'MARKETPLACE_REPOSITORY_PORT',
);

/**
 * Puerto del dominio para persistir y consultar configuraciones de marketplace.
 */
export interface MarketplaceRepositoryPort {
  /**
   * Lista todos los marketplaces disponibles.
   * @returns Coleccion de marketplaces ordenables.
   */
  list(): Promise<Marketplace[]>;

  /**
   * Busca un marketplace por su identificador unico.
   * @param id Identificador del marketplace.
   * @returns Marketplace si existe, null en caso contrario.
   */
  findById(id: string): Promise<Marketplace | null>;

  /**
   * Busca un marketplace por su slug unico.
   * @param slug Slug del marketplace.
   * @returns Marketplace si existe, null en caso contrario.
   */
  findBySlug(slug: string): Promise<Marketplace | null>;

  /**
   * Crea un nuevo marketplace.
   * @param marketplace Datos completos del marketplace a crear.
   * @returns Marketplace creado con ID asignado.
   */
  create(marketplace: Marketplace): Promise<Marketplace>;

  /**
   * Actualiza un marketplace existente.
   * @param id Identificador del marketplace.
   * @param marketplace Datos completos del marketplace actualizado.
   * @returns Marketplace actualizado.
   */
  update(id: string, marketplace: Marketplace): Promise<Marketplace>;

  /**
   * Elimina un marketplace.
   * @param id Identificador del marketplace.
   * @returns `true` si el marketplace existia y fue removido.
   */
  delete(id: string): Promise<boolean>;
}
