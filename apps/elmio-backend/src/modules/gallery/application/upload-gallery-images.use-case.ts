import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { GalleryImage } from '../domain/gallery-image';
import type { ArchivoSubido } from '../domain/gallery-image';
import {
  GALLERY_STORAGE_PORT,
  type GalleryStoragePort,
} from '../domain/ports/gallery-storage.port';

interface UploadGalleryImageInput {
  tenantDirectory: string;
  files: ArchivoSubido[];
}

/**
 * Caso de uso que valida y persiste una o varias imagenes de galeria.
 */
@Injectable()
export class UploadGalleryImagesUseCase {
  constructor(
    @Inject(GALLERY_STORAGE_PORT)
    private readonly galleryStoragePort: GalleryStoragePort,
  ) {}

  /**
   * Valida el lote recibido y almacena cada imagen bajo el tenant indicado.
   * @param input Tenant y archivos recibidos desde HTTP multipart.
   * @returns Imagenes persistidas con metadata completa.
   */
  async execute(input: UploadGalleryImageInput): Promise<GalleryImage[]> {
    if (input.files.length === 0) {
      throw new BadRequestException('Debes enviar al menos una imagen.');
    }

    for (const file of input.files) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException(
          `El archivo ${file.originalname} no es una imagen valida.`,
        );
      }
    }

    return Promise.all(
      input.files.map((file) =>
        this.galleryStoragePort.save({
          tenantDirectory: input.tenantDirectory,
          name: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          buffer: file.buffer,
        }),
      ),
    );
  }
}
