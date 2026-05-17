import type { GalleryImage } from '../gallery-image';

export const GALLERY_STORAGE_PORT = Symbol('GALLERY_STORAGE_PORT');

export interface SaveGalleryImageInput {
  tenantDirectory: string;
  name: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

/**
 * Puerto del dominio para persistir y consultar imagenes de la galeria.
 */
export interface GalleryStoragePort {
  /**
   * Lista las imagenes almacenadas para un tenant.
   * @param tenantDirectory Directorio reservado para el tenant.
   * @returns Coleccion de imagenes ordenables por fecha de carga.
   */
  listByTenant(tenantDirectory: string): Promise<GalleryImage[]>;

  /**
   * Persiste una imagen y devuelve su metadata final.
   * @param input Payload con contenido binario y metadata del archivo.
   * @returns Imagen almacenada lista para exponerse por HTTP.
   */
  save(input: SaveGalleryImageInput): Promise<GalleryImage>;

  /**
   * Elimina una imagen del tenant indicado.
   * @param tenantDirectory Directorio reservado para el tenant.
   * @param imageId Identificador interno del recurso.
   * @returns `true` si la imagen existia y fue removida.
   */
  delete(tenantDirectory: string, imageId: string): Promise<boolean>;

  /**
   * Resuelve la ubicacion o URL de preview para permitir acceso HTTP al recurso.
   * @param tenantDirectory Directorio reservado para el tenant.
   * @param imageId Identificador interno del recurso.
   * @returns Metadata y origen de preview si existe.
   */
  resolveFile(
    tenantDirectory: string,
    imageId: string,
  ): Promise<{
    image: GalleryImage;
    absolutePath?: string;
    publicUrl?: string;
  } | null>;
}
