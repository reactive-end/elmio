import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Category } from '../domain/category';
import {
  CATEGORY_REPOSITORY_PORT,
  type CategoryRepositoryPort,
} from '../domain/ports/category-repository.port';

interface CreateCategoryInput {
  name: string;
  description: string;
  active?: boolean;
}

interface UpdateCategoryInput {
  name: string;
  description: string;
  active: boolean;
}

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly repository: CategoryRepositoryPort,
  ) {}

  async execute(): Promise<Category[]> {
    return this.repository.list();
  }
}

@Injectable()
export class GetCategoryByIdUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly repository: CategoryRepositoryPort,
  ) {}

  async execute(id: string): Promise<Category> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Categoría con id "${id}" no encontrada.`);
    }
    return category;
  }
}

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly repository: CategoryRepositoryPort,
  ) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    if (!input.name?.trim()) {
      throw new BadRequestException(
        'El nombre de la categoría es obligatorio.',
      );
    }

    const slug = input.name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9\s-]/g, '') // Quitar caracteres raros
      .replace(/\s+/g, '-') // Cambiar espacios por guiones
      .replace(/-+/g, '-'); // Quitar guiones duplicados

    const existing = await this.repository.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`La categoría "${input.name}" ya existe.`);
    }

    const category: Category = {
      id: randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      slug,
      active: input.active ?? true,
      createdAt: new Date().toISOString(),
    };

    return this.repository.create(category);
  }
}

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly repository: CategoryRepositoryPort,
  ) {}

  async execute(id: string, input: UpdateCategoryInput): Promise<Category> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Categoría con id "${id}" no encontrada.`);
    }

    if (!input.name?.trim()) {
      throw new BadRequestException(
        'El nombre de la categoría es obligatorio.',
      );
    }

    const slug = input.name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const other = await this.repository.findBySlug(slug);
    if (other && other.id !== id) {
      throw new ConflictException(
        `Ya existe otra categoría con el nombre "${input.name}".`,
      );
    }

    const updated: Category = {
      ...existing,
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      slug,
      active: input.active,
    };

    return this.repository.update(id, updated);
  }
}

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly repository: CategoryRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Categoría con id "${id}" no encontrada.`);
    }
  }
}
