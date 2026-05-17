import { Module } from '@nestjs/common';
import type { GalleryStoragePort } from './domain/ports/gallery-storage.port';
import { DeleteGalleryImageUseCase } from './application/delete-gallery-image.use-case';
import { GetGalleryImageFileUseCase } from './application/get-gallery-image-file.use-case';
import { ListGalleryImagesUseCase } from './application/list-gallery-images.use-case';
import { UploadGalleryImagesUseCase } from './application/upload-gallery-images.use-case';
import { GALLERY_STORAGE_PORT } from './domain/ports/gallery-storage.port';
import { GoogleCloudGalleryStorageService } from './infrastructure/google-cloud-gallery-storage.service';
import { LocalGalleryStorageService } from './infrastructure/local-gallery-storage.service';
import { GalleryController } from './presentation/http/gallery.controller';

function createGalleryStorageProvider(): GalleryStoragePort {
  const hasInlineCredentials = Boolean(process.env.GCS_CREDENTIALS_JSON?.trim());
  const hasFileCredentials = Boolean(process.env.GCS_CREDENTIALS_JSON_PATH?.trim());
  const hasBucketName = Boolean(process.env.GCS_BUCKET_NAME?.trim());
  const hasDefaultProject = Boolean(process.env.GOOGLE_CLOUD_PROJECT?.trim());

  if (hasBucketName && (hasInlineCredentials || hasFileCredentials || hasDefaultProject)) {
    return new GoogleCloudGalleryStorageService();
  }

  return new LocalGalleryStorageService();
}

/**
 * Modulo que agrupa la feature de galeria de imagenes del dashboard.
 */
@Module({
  controllers: [GalleryController],
  providers: [
    ListGalleryImagesUseCase,
    UploadGalleryImagesUseCase,
    DeleteGalleryImageUseCase,
    GetGalleryImageFileUseCase,
    LocalGalleryStorageService,
    GoogleCloudGalleryStorageService,
    {
      provide: GALLERY_STORAGE_PORT,
      useFactory: createGalleryStorageProvider,
    },
  ],
})
export class GalleryModule {}
