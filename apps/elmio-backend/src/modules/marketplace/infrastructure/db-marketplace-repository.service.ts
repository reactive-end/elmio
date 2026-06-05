import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Marketplace } from '../domain/marketplace';
import type { MarketplaceRepositoryPort } from '../domain/ports/marketplace-repository.port';
import { MarketplaceEntity } from './entities/marketplace.entity';

@Injectable()
export class DbMarketplaceRepositoryService implements MarketplaceRepositoryPort {
  constructor(
    @InjectRepository(MarketplaceEntity)
    private readonly repo: Repository<MarketplaceEntity>,
  ) {}

  private toDomain(entity: MarketplaceEntity): Marketplace {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      description: entity.description || '',
      active: entity.active,
      owner: entity.owner,
      logo: entity.logo || '',
      theme: entity.theme,
      whatsapp: entity.whatsapp,
      carrito: entity.carrito,
      sections: entity.sections,
    };
  }

  private toPersistence(domain: Marketplace): MarketplaceEntity {
    const entity = new MarketplaceEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.slug = domain.slug;
    entity.description = domain.description;
    entity.active = domain.active;
    entity.owner = domain.owner;
    entity.logo = domain.logo;
    entity.theme = domain.theme;
    entity.whatsapp = domain.whatsapp;
    entity.carrito = domain.carrito;
    entity.sections = domain.sections;
    return entity;
  }

  async list(): Promise<Marketplace[]> {
    const entities = await this.repo.find();
    return entities.map((entity) => this.toDomain(entity));
  }

  async findById(id: string): Promise<Marketplace | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<Marketplace | null> {
    const entity = await this.repo.findOne({ where: { slug } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(marketplace: Marketplace): Promise<Marketplace> {
    const entity = this.toPersistence(marketplace);
    await this.repo.save(entity);
    return marketplace;
  }

  async update(id: string, marketplace: Marketplace): Promise<Marketplace> {
    console.log(
      '[DbMarketplaceRepositoryService] UPDATE DOMAIN WHATSAPP:',
      JSON.stringify(marketplace.whatsapp, null, 2),
    );
    const entity = this.toPersistence(marketplace);
    console.log(
      '[DbMarketplaceRepositoryService] UPDATE ENTITY WHATSAPP:',
      JSON.stringify(entity.whatsapp, null, 2),
    );
    entity.id = id;
    await this.repo.save(entity);
    return marketplace;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (
      result.affected !== undefined &&
      result.affected !== null &&
      result.affected > 0
    );
  }
}
