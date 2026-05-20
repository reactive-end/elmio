import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Marketplace } from '../domain/marketplace';
import type { MarketplaceRepositoryPort } from '../domain/ports/marketplace-repository.port';

interface MetadataFile {
  marketplaces: Marketplace[];
}

/**
 * Implementacion local del repositorio de marketplaces usando archivos JSON.
 * Almacena la configuracion de cada marketplace en el filesystem.
 */
@Injectable()
export class FileMarketplaceRepositoryService implements MarketplaceRepositoryPort {
  private readonly storageRoot = resolve(
    process.cwd(),
    'storage',
    'marketplaces',
  );
  private readonly metadataFileName = 'marketplaces.metadata.json';

  private getMetadataFilePath(): string {
    return join(this.storageRoot, this.metadataFileName);
  }

  private async ensureStorageDirectory(): Promise<void> {
    await mkdir(this.storageRoot, { recursive: true });
  }

  private async readMetadata(): Promise<MetadataFile> {
    await this.ensureStorageDirectory();

    try {
      const raw = await readFile(this.getMetadataFilePath(), 'utf8');
      const parsed = JSON.parse(raw) as MetadataFile;

      return { marketplaces: parsed.marketplaces ?? [] };
    } catch {
      return { marketplaces: [] };
    }
  }

  private async writeMetadata(metadata: MetadataFile): Promise<void> {
    await this.ensureStorageDirectory();
    await writeFile(
      this.getMetadataFilePath(),
      JSON.stringify(metadata, null, 2),
      'utf8',
    );
  }

  /**
   * Lista todos los marketplaces ordenados por fecha de creacion descendente.
   * @returns Coleccion de marketplaces.
   */
  async list(): Promise<Marketplace[]> {
    const metadata = await this.readMetadata();
    return [...metadata.marketplaces].reverse();
  }

  /**
   * Busca un marketplace por su ID unico.
   * @param id Identificador del marketplace.
   * @returns Marketplace o null si no existe.
   */
  async findById(id: string): Promise<Marketplace | null> {
    const metadata = await this.readMetadata();
    return metadata.marketplaces.find((m) => m.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<Marketplace | null> {
    const metadata = await this.readMetadata();
    const matches = metadata.marketplaces.filter(
      (m) => m.slug === slug.toLowerCase(),
    );
    if (matches.length === 0) return null;
    return matches.find((m) => m.active) ?? matches[0];
  }

  /**
   * Crea un nuevo marketplace y lo persiste.
   * @param marketplace Datos completos del marketplace.
   * @returns Marketplace creado.
   */
  async create(marketplace: Marketplace): Promise<Marketplace> {
    const metadata = await this.readMetadata();
    metadata.marketplaces.push(marketplace);
    await this.writeMetadata(metadata);

    return marketplace;
  }

  /**
   * Actualiza un marketplace existente.
   * @param id Identificador del marketplace.
   * @param marketplace Datos actualizados completos.
   * @returns Marketplace actualizado.
   */
  async update(id: string, marketplace: Marketplace): Promise<Marketplace> {
    const metadata = await this.readMetadata();
    const index = metadata.marketplaces.findIndex((m) => m.id === id);

    if (index === -1) {
      throw new Error(`Marketplace ${id} no encontrado para actualizar.`);
    }

    metadata.marketplaces[index] = marketplace;
    await this.writeMetadata(metadata);

    return marketplace;
  }

  /**
   * Elimina un marketplace del indice.
   * @param id Identificador del marketplace.
   * @returns `true` si fue eliminado, `false` si no existia.
   */
  async delete(id: string): Promise<boolean> {
    const metadata = await this.readMetadata();
    const index = metadata.marketplaces.findIndex((m) => m.id === id);

    if (index === -1) {
      return false;
    }

    metadata.marketplaces.splice(index, 1);
    await this.writeMetadata(metadata);

    return true;
  }
}
