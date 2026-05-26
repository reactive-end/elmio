import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { GalleryImage } from '../domain/gallery-image';
import type {
  GalleryStoragePort,
  SaveGalleryImageInput,
} from '../domain/ports/gallery-storage.port';
import { GalleryImageEntity } from './entities/gallery-image.entity';

/**
 * Implementacion local del almacenamiento de galeria usando disco y PostgreSQL para metadata.
 */
@Injectable()
export class LocalGalleryStorageService implements GalleryStoragePort {
  private readonly storageRoot = resolve(process.cwd(), 'storage', 'gallery');

  constructor(
    @InjectRepository(GalleryImageEntity)
    private readonly galleryRepository: Repository<GalleryImageEntity>,
  ) {}

  private getTenantDirectoryPath(tenantDirectory: string): string {
    return join(this.storageRoot, tenantDirectory);
  }

  private async ensureTenantDirectory(tenantDirectory: string): Promise<void> {
    await mkdir(this.getTenantDirectoryPath(tenantDirectory), {
      recursive: true,
    });
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

  /**
   * Lista las imagenes de un tenant ordenadas por fecha descendente desde la DB.
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
   * Persiste un archivo localmente y actualiza el indice relacional en PostgreSQL.
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

    // 1. Guardar archivo físico en el disco
    await writeFile(
      join(this.getTenantDirectoryPath(input.tenantDirectory), fileName),
      input.buffer,
    );

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
   * Elimina archivo fisico y metadata en PostgreSQL.
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

    // 2. Eliminar del sistema de archivos
    const absolutePath = join(
      this.getTenantDirectoryPath(tenantDirectory),
      entity.fileName,
    );

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

    const absolutePath = join(
      this.getTenantDirectoryPath(tenantDirectory),
      entity.fileName,
    );

    try {
      await stat(absolutePath);
      return { image, absolutePath };
    } catch {
      return null;
    }
  }
}

