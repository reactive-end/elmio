import { Storage, type StorageOptions } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { GalleryImage } from '../domain/gallery-image';
import type {
  GalleryStoragePort,
  SaveGalleryImageInput,
} from '../domain/ports/gallery-storage.port';

interface GalleryMetadataFile {
  images: GalleryImage[];
}

/**
 * Implementacion de galeria sobre Google Cloud Storage con metadata local por tenant.
 * Las credenciales pueden llegar como JSON inline o desde un archivo JSON en disco.
 */
@Injectable()
export class GoogleCloudGalleryStorageService implements GalleryStoragePort {
  private readonly storageRoot = resolve(process.cwd(), 'storage', 'gallery');
  private readonly metadataFileName = 'gallery.metadata.json';
  private readonly bucketName = process.env.GCS_BUCKET_NAME ?? '';
  private readonly publicBaseUrl = process.env.GCS_PUBLIC_BASE_URL?.trim() ?? '';
  private readonly storageClient = this.createStorageClient();

  private createStorageClient(): Storage {
    const credentialsJson = process.env.GCS_CREDENTIALS_JSON?.trim();
    const credentialsPath = process.env.GCS_CREDENTIALS_JSON_PATH?.trim();

    if (credentialsJson) {
      const options = {
        credentials: JSON.parse(credentialsJson) as StorageOptions['credentials'],
      } satisfies StorageOptions;

      return new Storage(options);
    }

    if (credentialsPath) {
      return new Storage({ keyFilename: credentialsPath });
    }

    return new Storage();
  }

  private getTenantDirectoryPath(tenantDirectory: string): string {
    return join(this.storageRoot, tenantDirectory);
  }

  private getMetadataFilePath(tenantDirectory: string): string {
    return join(this.getTenantDirectoryPath(tenantDirectory), this.metadataFileName);
  }

  private async ensureTenantDirectory(tenantDirectory: string): Promise<void> {
    await mkdir(this.getTenantDirectoryPath(tenantDirectory), { recursive: true });
  }

  private async readMetadata(tenantDirectory: string): Promise<GalleryMetadataFile> {
    await this.ensureTenantDirectory(tenantDirectory);

    try {
      const raw = await readFile(this.getMetadataFilePath(tenantDirectory), 'utf8');
      const parsed = JSON.parse(raw) as GalleryMetadataFile;
      return { images: parsed.images ?? [] };
    } catch {
      return { images: [] };
    }
  }

  private async writeMetadata(
    tenantDirectory: string,
    metadata: GalleryMetadataFile,
  ): Promise<void> {
    await this.ensureTenantDirectory(tenantDirectory);

    await writeFile(
      this.getMetadataFilePath(tenantDirectory),
      JSON.stringify(metadata, null, 2),
      'utf8',
    );
  }

  private buildStoredFileName(originalName: string): string {
    const extension = originalName.includes('.')
      ? `.${originalName.split('.').pop()?.toLowerCase() ?? 'bin'}`
      : '';

    return `${randomUUID()}${extension}`;
  }

  private buildStoragePath(tenantDirectory: string, originalName: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = originalName.trim().toLowerCase().replace(/[^a-z0-9.-]+/g, '-');

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

    const [signedUrl] = await this.getBucket().file(objectKey).getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 15,
      version: 'v4',
    });

    return signedUrl;
  }

  private getBucket() {
    if (!this.bucketName) {
      throw new Error('Debes definir GCS_BUCKET_NAME para usar la galeria en Google Cloud Storage.');
    }

    return this.storageClient.bucket(this.bucketName);
  }

  /**
   * Lista las imagenes de un tenant ordenadas por fecha descendente.
   * @param tenantDirectory Directorio reservado para el tenant.
   * @returns Imagenes disponibles para exposicion HTTP.
   */
  async listByTenant(tenantDirectory: string): Promise<GalleryImage[]> {
    const metadata = await this.readMetadata(tenantDirectory);

    return metadata.images.toSorted((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }

  /**
   * Persiste un archivo en el bucket GCS y actualiza el indice local del tenant.
   * @param input Archivo y metadata del recurso recibido.
   * @returns Imagen almacenada con identificador y ruta final.
   */
  async save(input: SaveGalleryImageInput): Promise<GalleryImage> {
    await this.ensureTenantDirectory(input.tenantDirectory);

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

    await this.getBucket().file(objectKey).save(input.buffer, {
      contentType: input.mimeType,
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    const metadata = await this.readMetadata(input.tenantDirectory);
    metadata.images.unshift(image);
    await this.writeMetadata(input.tenantDirectory, metadata);

    return image;
  }

  /**
   * Elimina archivo del bucket y metadata local del tenant.
   * @param tenantDirectory Directorio reservado para el tenant.
   * @param imageId Identificador interno del recurso.
   * @returns `true` si la imagen existia y fue removida.
   */
  async delete(tenantDirectory: string, imageId: string): Promise<boolean> {
    const metadata = await this.readMetadata(tenantDirectory);
    const image = metadata.images.find((item) => item.id === imageId);

    if (!image) {
      return false;
    }

    metadata.images = metadata.images.filter((item) => item.id !== imageId);
    await this.writeMetadata(tenantDirectory, metadata);

    const objectKey = this.buildObjectKey(tenantDirectory, image.fileName);
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
  ): Promise<{ image: GalleryImage; absolutePath?: string; publicUrl?: string } | null> {
    const metadata = await this.readMetadata(tenantDirectory);
    const image = metadata.images.find((item) => item.id === imageId);

    if (!image) {
      return null;
    }

    const objectKey = this.buildObjectKey(tenantDirectory, image.fileName);
    return { image, publicUrl: await this.buildPreviewUrl(objectKey) };
  }
}
