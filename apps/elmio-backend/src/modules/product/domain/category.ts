/**
 * Entidad de dominio que representa una categoria del catalogo de productos.
 */
export interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  active: boolean;
  createdAt: string;
}
