import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, stat, unlink, writeFile } from 'node:fs/promises';
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
 * Implementacion local del almacenamiento de galeria usando disco y metadata JSON.
 * Esta estrategia se podra reemplazar por Google Cloud Storage manteniendo el puerto estable.
 */
@Injectable()
export class LocalGalleryStorageService implements GalleryStoragePort {
  private readonly storageRoot = resolve(process.cwd(), 'storage', 'gallery');
  private readonly metadataFileName = 'gallery.metadata.json';

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
   * Persiste un archivo localmente y actualiza el indice JSON del tenant.
   * @param input Archivo y metadata del recurso recibido.
   * @returns Imagen almacenada con identificador y ruta final.
   */
  async save(input: SaveGalleryImageInput): Promise<GalleryImage> {
    await this.ensureTenantDirectory(input.tenantDirectory);

    const fileName = this.buildStoredFileName(input.name);
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

    await writeFile(
      join(this.getTenantDirectoryPath(input.tenantDirectory), fileName),
      input.buffer,
    );

    const metadata = await this.readMetadata(input.tenantDirectory);
    metadata.images.unshift(image);
    await this.writeMetadata(input.tenantDirectory, metadata);

    return image;
  }

  /**
   * Elimina archivo fisico y metadata de una imagen del tenant.
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

    const absolutePath = join(this.getTenantDirectoryPath(tenantDirectory), image.fileName);

    try {
      await unlink(absolutePath);
    } catch {
      await rm(absolutePath, { force: true });
    }

    return true;
  }

  /**
   * Resuelve la ubicacion local de un archivo de imagen para su streaming.
   * @param tenantDirectory Directorio reservado para el tenant.
   * @param imageId Identificador interno del recurso.
   * @returns Metadata y ruta absoluta del archivo si el recurso existe.
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

    const absolutePath = join(this.getTenantDirectoryPath(tenantDirectory), image.fileName);

    try {
      await stat(absolutePath);
      return { image, absolutePath };
    } catch {
      return null;
    }
  }
}
