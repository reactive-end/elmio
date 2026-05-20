import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Category } from '../domain/category';
import type { CategoryRepositoryPort } from '../domain/ports/category-repository.port';
import { CategoryEntity } from './entities/category.entity';

@Injectable()
export class DbCategoryRepositoryService implements CategoryRepositoryPort {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repo: Repository<CategoryEntity>,
  ) {}

  private toDomain(entity: CategoryEntity): Category {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      slug: entity.slug,
      active: entity.active,
      createdAt: entity.createdAt,
    };
  }

  private toPersistence(domain: Category): CategoryEntity {
    const entity = new CategoryEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.slug = domain.slug;
    entity.active = domain.active;
    entity.createdAt = domain.createdAt;
    return entity;
  }

  async list(): Promise<Category[]> {
    const entities = await this.repo.find();
    return entities.map((entity) => this.toDomain(entity));
  }

  async findById(id: string): Promise<Category | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const entity = await this.repo.findOne({ where: { slug } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(category: Category): Promise<Category> {
    const entity = this.toPersistence(category);
    await this.repo.save(entity);
    return category;
  }

  async update(id: string, category: Category): Promise<Category> {
    const entity = this.toPersistence(category);
    entity.id = id;
    await this.repo.save(entity);
    return category;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected !== undefined && result.affected !== null && result.affected > 0;
  }
}
