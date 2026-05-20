import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Category } from '../domain/category';
import type { CategoryRepositoryPort } from '../domain/ports/category-repository.port';

interface StorageData {
  categories: Category[];
}

/**
 * Implementacion local del repositorio de categorias usando archivos JSON.
 */
@Injectable()
export class FileCategoryRepositoryService implements CategoryRepositoryPort {
  private readonly storageRoot = resolve(process.cwd(), 'storage', 'products');
  private readonly fileName = 'categories.metadata.json';

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
      return { categories: parsed.categories ?? [] };
    } catch {
      return { categories: [] };
    }
  }

  private async write(data: StorageData): Promise<void> {
    await this.ensureDir();
    await writeFile(this.getFilePath(), JSON.stringify(data, null, 2), 'utf8');
  }

  async list(): Promise<Category[]> {
    const data = await this.read();
    return [...data.categories].reverse();
  }

  async findById(id: string): Promise<Category | null> {
    const data = await this.read();
    return data.categories.find((c) => c.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const data = await this.read();
    return data.categories.find((c) => c.slug === slug.toLowerCase()) ?? null;
  }

  async create(category: Category): Promise<Category> {
    const data = await this.read();
    data.categories.push(category);
    await this.write(data);
    return category;
  }

  async update(id: string, category: Category): Promise<Category> {
    const data = await this.read();
    const idx = data.categories.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw new Error(`Categoría ${id} no encontrada para actualizar.`);
    }
    data.categories[idx] = category;
    await this.write(data);
    return category;
  }

  async delete(id: string): Promise<boolean> {
    const data = await this.read();
    const idx = data.categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    data.categories.splice(idx, 1);
    await this.write(data);
    return true;
  }
}
