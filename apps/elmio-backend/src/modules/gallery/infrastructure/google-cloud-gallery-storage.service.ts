import { Storage, type StorageOptions } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import type { GalleryImage } from '../domain/gallery-image';
import type {
  GalleryStoragePort,
  SaveGalleryImageInput,
} from '../domain/ports/gallery-storage.port';
import { GalleryImageEntity } from './entities/gallery-image.entity';

/**
 * Implementacion de galeria sobre Google Cloud Storage con metadata en PostgreSQL.
 * Las credenciales pueden llegar como JSON inline o desde un archivo JSON en disco.
 */
@Injectable()
export class GoogleCloudGalleryStorageService implements GalleryStoragePort {
  private readonly bucketName = process.env.GCS_BUCKET_NAME ?? '';
  private readonly publicBaseUrl =
    process.env.GCS_PUBLIC_BASE_URL?.trim() ?? '';
  private readonly storageClient = this.createStorageClient();

  constructor(
    @InjectRepository(GalleryImageEntity)
    private readonly galleryRepository: Repository<GalleryImageEntity>,
  ) {}

  private createStorageClient(): Storage {
    const credentialsJson = process.env.GCS_CREDENTIALS_JSON?.trim();
    const credentialsPath = process.env.GCS_CREDENTIALS_JSON_PATH?.trim();

    if (credentialsJson) {
      const options = {
        credentials: JSON.parse(
          credentialsJson,
        ) as StorageOptions['credentials'],
      } satisfies StorageOptions;

      return new Storage(options);
    }

    if (credentialsPath) {
      return new Storage({ keyFilename: credentialsPath });
    }

    return new Storage();
  }

  private buildStoredFileName(originalName: string): string {
    const extension = originalName.includes('.')
      ? `.${originalName.split('.').pop()?.toLowerCase() ?? 'bin'}`
      : '';

    return `${randomUUID()}${extension}`;
  }

  private buildStoragePath(
    tenantDirectory: string,
    originalName: string,
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = originalName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-');

    return `${tenantDirectory}/${timestamp}-${safeName}`;
  }

  private buildObjectKey(tenantDirectory: string, fileName: string): string {
    return `${tenantDirectory}/${fileName}`;
  }

  private buildPublicUrl(objectKey: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/$/, '')}/${objectKey}`;
    }

    return `https://storage.googleapis.com/${this.bucketName}/${objectKey}`;
  }

  private async buildPreviewUrl(objectKey: string): Promise<string> {
    if (this.publicBaseUrl) {
      return this.buildPublicUrl(objectKey);
    }

    const [signedUrl] = await this.getBucket()
      .file(objectKey)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + 1000 * 60 * 15,
        version: 'v4',
      });

    return signedUrl;
  }

  private getBucket() {
    if (!this.bucketName) {
      throw new Error(
        'Debes definir GCS_BUCKET_NAME para usar la galeria en Google Cloud Storage.',
      );
    }

    return this.storageClient.bucket(this.bucketName);
  }

  /**
   * Lista las imagenes de un tenant ordenadas por fecha descendente desde PostgreSQL.
   * @param tenantDirectory Directorio reservado para el tenant.
   * @returns Imagenes disponibles para exposicion HTTP.
   */
  async listByTenant(tenantDirectory: string): Promise<GalleryImage[]> {
    const entities = await this.galleryRepository.find({
      where: { tenantDirectory },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => ({
      id: entity.id,
      tenantDirectory: entity.tenantDirectory,
      name: entity.name,
      mimeType: entity.mimeType,
      size: entity.size,
      storagePath: entity.storagePath,
      fileName: entity.fileName,
      createdAt: entity.createdAt,
    }));
  }

  /**
   * Persiste un archivo en el bucket GCS y guarda su metadata en PostgreSQL.
   * @param input Archivo y metadata del recurso recibido.
   * @returns Imagen almacenada con identificador y ruta final.
   */
  async save(input: SaveGalleryImageInput): Promise<GalleryImage> {
    const fileName = this.buildStoredFileName(input.name);
    const objectKey = this.buildObjectKey(input.tenantDirectory, fileName);
    const image: GalleryImage = {
      id: randomUUID(),
      tenantDirectory: input.tenantDirectory,
      name: input.name,
      mimeType: input.mimeType,
      size: input.size,
      storagePath: this.buildStoragePath(input.tenantDirectory, input.name),
      fileName,
      createdAt: new Date().toISOString(),
    };

    // 1. Guardar archivo físico en GCS
    await this.getBucket()
      .file(objectKey)
      .save(input.buffer, {
        contentType: input.mimeType,
        resumable: false,
        metadata: {
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });

    // 2. Guardar metadata en la base de datos relacional
    const entity = this.galleryRepository.create({
      id: image.id,
      tenantDirectory: image.tenantDirectory,
      name: image.name,
      mimeType: image.mimeType,
      size: image.size,
      storagePath: image.storagePath,
      fileName: image.fileName,
      createdAt: image.createdAt,
    });

    await this.galleryRepository.save(entity);

    return image;
  }

  /**
   * Elimina archivo del bucket y metadata en PostgreSQL.
   * @param tenantDirectory Directorio reservado para el tenant.
   * @param imageId Identificador interno del recurso.
   * @returns `true` si la imagen existia y fue removida.
   */
  async delete(tenantDirectory: string, imageId: string): Promise<boolean> {
    const entity = await this.galleryRepository.findOne({
      where: { id: imageId, tenantDirectory },
    });

    if (!entity) {
      return false;
    }

    // 1. Eliminar de la base de datos
    await this.galleryRepository.remove(entity);

    // 2. Eliminar de GCS
    const objectKey = this.buildObjectKey(tenantDirectory, entity.fileName);
    await this.getBucket().file(objectKey).delete({ ignoreNotFound: true });

    return true;
  }

  /**
   * Resuelve la URL publica del objeto en GCS para su preview HTTP.
   * @param tenantDirectory Directorio reservado para el tenant.
   * @param imageId Identificador interno del recurso.
   * @returns Metadata y URL publica si el recurso existe.
   */
  async resolveFile(
    tenantDirectory: string,
    imageId: string,
  ): Promise<{
    image: GalleryImage;
    absolutePath?: string;
    publicUrl?: string;
  } | null> {
    // 1. Intentar buscar por ID y tenantDirectory
    let entity = await this.galleryRepository.findOne({
      where: { id: imageId, tenantDirectory },
    });

    // 2. Si no se encuentra, intentar buscar por name y tenantDirectory
    if (!entity) {
      entity = await this.galleryRepository.findOne({
        where: { name: imageId, tenantDirectory },
      });
    }

    // 3. Fallback: intentar buscar por fileName y tenantDirectory
    if (!entity) {
      entity = await this.galleryRepository.findOne({
        where: { fileName: imageId, tenantDirectory },
      });
    }

    if (!entity) {
      return null;
    }

    const image: GalleryImage = {
      id: entity.id,
      tenantDirectory: entity.tenantDirectory,
      name: entity.name,
      mimeType: entity.mimeType,
      size: entity.size,
      storagePath: entity.storagePath,
      fileName: entity.fileName,
      createdAt: entity.createdAt,
    };

    const objectKey = this.buildObjectKey(tenantDirectory, entity.fileName);
    return { image, publicUrl: await this.buildPreviewUrl(objectKey) };
  }
}
