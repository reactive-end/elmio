import { Inject, Injectable } from '@nestjs/common';
import type { GalleryImage } from '../domain/gallery-image';
import {
  GALLERY_STORAGE_PORT,
  type GalleryStoragePort,
} from '../domain/ports/gallery-storage.port';

/**
 * Caso de uso que obtiene la biblioteca de imagenes de un tenant.
 */
@Injectable()
export class ListGalleryImagesUseCase {
  constructor(
    @Inject(GALLERY_STORAGE_PORT)
    private readonly galleryStoragePort: GalleryStoragePort,
  ) {}

  /**
   * Obtiene las imagenes de la galeria para el tenant indicado.
   * @param tenantDirectory Directorio reservado para el tenant.
   * @returns Lista de imagenes disponibles.
   */
  execute(tenantDirectory: string): Promise<GalleryImage[]> {
    return this.galleryStoragePort.listByTenant(tenantDirectory);
  }
}
