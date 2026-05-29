import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Product, ProductType, FinancingScheme } from '../domain/product';
import type { ProductRepositoryPort } from '../domain/ports/product-repository.port';
import { ProductEntity } from './entities/product.entity';

@Injectable()
export class DbProductRepositoryService implements ProductRepositoryPort {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repo: Repository<ProductEntity>,
  ) {}

  private toDomain(entity: ProductEntity): Product {
    return {
      id: entity.id,
      sku: entity.sku,
      name: entity.name,
      description: entity.description,
      type: entity.type as ProductType,
      category: entity.category,
      tags: entity.tags,
      images: entity.images,
      active: entity.active,
      hasStock: entity.hasStock,
      currentStock: entity.currentStock,
      minimumStock: entity.minimumStock,
      hasValidity: entity.hasValidity,
      validFrom: entity.validFrom,
      validTo: entity.validTo,
      attributes: entity.attributes,
      priceLists: entity.priceLists,
      discounts: entity.discounts,
      financingSchemes: entity.financingSchemes || [],
      interestType: entity.interestType as 'none' | 'percentage' | 'fixed',
      interestRate: entity.interestRate,
      usesThirdPartyPricing: entity.usesThirdPartyPricing,
      globalThirdPartyProvider: entity.globalThirdPartyProvider,
      windows: entity.windows,
      marketplaceId: entity.marketplaceId,
      alternativeBankAccountId: entity.alternativeBankAccountId,
      actions: entity.actions || [],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toPersistence(domain: Product): ProductEntity {
    const entity = new ProductEntity();
    entity.id = domain.id;
    entity.sku = domain.sku;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.type = domain.type;
    entity.category = domain.category;
    entity.tags = domain.tags;
    entity.images = domain.images;
    entity.active = domain.active;
    entity.hasStock = domain.hasStock;
    entity.currentStock = domain.currentStock;
    entity.minimumStock = domain.minimumStock;
    entity.hasValidity = domain.hasValidity;
    entity.validFrom = domain.validFrom;
    entity.validTo = domain.validTo;
    entity.attributes = domain.attributes;
    entity.priceLists = domain.priceLists;
    entity.discounts = domain.discounts;
    entity.financingSchemes = domain.financingSchemes || [];
    entity.interestType = domain.interestType;
    entity.interestRate = domain.interestRate;
    entity.usesThirdPartyPricing = domain.usesThirdPartyPricing;
    entity.globalThirdPartyProvider = domain.globalThirdPartyProvider;
    entity.windows = domain.windows;
    entity.marketplaceId = domain.marketplaceId;
    entity.alternativeBankAccountId = domain.alternativeBankAccountId || null;
    entity.actions = domain.actions || [];
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }

  async list(): Promise<Product[]> {
    const entities = await this.repo.find();
    return entities.map((entity) => this.toDomain(entity));
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const entity = await this.repo.findOne({ where: { sku } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByMarketplace(marketplaceId: string): Promise<Product[]> {
    const entities = await this.repo.find({ where: { marketplaceId } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async save(product: Product): Promise<Product> {
    const entity = this.toPersistence(product);
    await this.repo.save(entity);
    return product;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected !== undefined && result.affected !== null && result.affected > 0;
  }
}
