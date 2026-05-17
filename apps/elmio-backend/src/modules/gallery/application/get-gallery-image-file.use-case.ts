import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GALLERY_STORAGE_PORT,
  type GalleryStoragePort,
} from '../domain/ports/gallery-storage.port';

/**
 * Caso de uso que resuelve el archivo fisico asociado a una imagen de galeria.
 */
@Injectable()
export class GetGalleryImageFileUseCase {
  constructor(
    @Inject(GALLERY_STORAGE_PORT)
    private readonly galleryStoragePort: GalleryStoragePort,
  ) {}

  /**
   * Resuelve metadata y ruta del archivo para su streaming HTTP.
   * @param tenantDirectory Directorio reservado para el tenant.
   * @param imageId Identificador interno del recurso.
   * @returns Ruta absoluta y metadata de la imagen.
   */
  async execute(tenantDirectory: string, imageId: string) {
    const resolvedFile = await this.galleryStoragePort.resolveFile(
      tenantDirectory,
      imageId,
    );

    if (!resolvedFile) {
      throw new NotFoundException('La imagen solicitada no existe.');
    }

    return resolvedFile;
  }
}
