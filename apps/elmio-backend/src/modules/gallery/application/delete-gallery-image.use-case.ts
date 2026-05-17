import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GALLERY_STORAGE_PORT,
  type GalleryStoragePort,
} from '../domain/ports/gallery-storage.port';

/**
 * Caso de uso que elimina una imagen del tenant indicado.
 */
@Injectable()
export class DeleteGalleryImageUseCase {
  constructor(
    @Inject(GALLERY_STORAGE_PORT)
    private readonly galleryStoragePort: GalleryStoragePort,
  ) {}

  /**
   * Elimina la imagen del tenant. Falla si el recurso no existe.
   * @param tenantDirectory Directorio reservado para el tenant.
   * @param imageId Identificador interno del recurso.
   * @returns `void` cuando la eliminacion se completa.
   */
  async execute(tenantDirectory: string, imageId: string): Promise<void> {
    const wasDeleted = await this.galleryStoragePort.delete(tenantDirectory, imageId);

    if (!wasDeleted) {
      throw new NotFoundException('La imagen solicitada no existe.');
    }
  }
}
