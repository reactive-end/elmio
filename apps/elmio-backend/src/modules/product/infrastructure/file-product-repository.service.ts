import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Product } from '../domain/product';
import type { ProductRepositoryPort } from '../domain/ports/product-repository.port';

interface StorageData {
  products: Product[];
}

/**
 * Implementacion local del repositorio de productos usando archivos JSON.
 */
@Injectable()
export class FileProductRepositoryService implements ProductRepositoryPort {
  private readonly storageRoot = resolve(process.cwd(), 'storage', 'products');
  private readonly fileName = 'products.metadata.json';

  private getFilePath(): string {
    return join(this.storageRoot, this.fileName);
  }

  private async ensureDir(): Promise<void> {
    await mkdir(this.storageRoot, { recursive: true });
  }

  private async read(): Promise<StorageData> {
    await this.ensureDir();
    try {
      const raw = await readFile(this.getFilePath(), 'utf8');
      const parsed = JSON.parse(raw) as Partial<StorageData>;
      return { products: parsed.products ?? [] };
    } catch {
      return { products: [] };
    }
  }

  private async write(data: StorageData): Promise<void> {
    await this.ensureDir();
    await writeFile(this.getFilePath(), JSON.stringify(data, null, 2), 'utf8');
  }

  async list(): Promise<Product[]> {
    const data = await this.read();
    return [...data.products].reverse();
  }

  async findById(id: string): Promise<Product | null> {
    const data = await this.read();
    return data.products.find((p) => p.id === id) ?? null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const data = await this.read();
    return data.products.find((p) => p.sku === sku) ?? null;
  }

  async findByMarketplace(marketplaceId: string): Promise<Product[]> {
    const data = await this.read();
    return data.products.filter((p) => p.marketplaceId === marketplaceId);
  }

  async save(product: Product): Promise<Product> {
    const data = await this.read();
    const idx = data.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      data.products[idx] = product;
    } else {
      data.products.push(product);
    }
    await this.write(data);
    return product;
  }

  async delete(id: string): Promise<boolean> {
    const data = await this.read();
    const idx = data.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    data.products.splice(idx, 1);
    await this.write(data);
    return true;
  }
}
