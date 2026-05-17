import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  Product,
  ProductType,
  PaymentMode,
  PriceList,
  DiscountPeriod,
  ProductAttribute,
  ProductWindow,
} from '../domain/product';
import {
  PRODUCT_REPOSITORY_PORT,
  type ProductRepositoryPort,
} from '../domain/ports/product-repository.port';

export interface CreateProductInput {
  sku: string;
  name: string;
  description: string;
  type: ProductType;
  category: string;
  tags: string[];
  images: string[];
  currentStock: number;
  minimumStock: number;
  hasValidity: boolean;
  validFrom: string | null;
  validTo: string | null;
  attributes: ProductAttribute[];
  priceLists: Omit<PriceList, 'id'>[];
  discounts: Omit<DiscountPeriod, 'id'>[];
  paymentMode: PaymentMode;
  maxQuotas: number;
  interestRate: number;
  usesThirdPartyPricing: boolean;
  windows: Omit<ProductWindow, 'id'>[];
  marketplaceId: string | null;
}

/**
 * Caso de uso para crear un nuevo producto en el catalogo.
 */
@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly repository: ProductRepositoryPort,
  ) {}

  async execute(input: CreateProductInput): Promise<Product> {
    if (!input.sku?.trim()) {
      throw new BadRequestException('El SKU es obligatorio.');
    }
    if (!input.name?.trim()) {
      throw new BadRequestException('El nombre es obligatorio.');
    }

    const existing = await this.repository.findBySku(input.sku.trim());
    if (existing) {
      throw new BadRequestException(`El SKU "${input.sku}" ya esta en uso.`);
    }

    const now = new Date().toISOString();

    const product: Product = {
      id: randomUUID(),
      sku: input.sku.trim().toUpperCase(),
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      type: input.type ?? 'PRODUCT',
      category: input.category?.trim() ?? '',
      tags: input.tags ?? [],
      images: input.images ?? [],
      active: true,
      currentStock: input.currentStock ?? 0,
      minimumStock: input.minimumStock ?? 0,
      hasValidity: input.hasValidity ?? false,
      validFrom: input.validFrom ?? null,
      validTo: input.validTo ?? null,
      attributes: (input.attributes ?? []).map((a) => ({
        ...a,
        id: a.id || randomUUID(),
      })),
      priceLists: (input.priceLists ?? []).map((p) => ({
        ...p,
        id: randomUUID(),
        thirdPartyProvider: p.thirdPartyProvider ?? null,
        thirdPartyRef: p.thirdPartyRef ?? null,
        lastSyncAt: p.lastSyncAt ?? null,
      })),
      discounts: (input.discounts ?? []).map((d) => ({
        ...d,
        id: randomUUID(),
      })),
      paymentMode: input.paymentMode ?? 'cash',
      maxQuotas: input.maxQuotas ?? 1,
      interestRate: input.interestRate ?? 0,
      usesThirdPartyPricing: input.usesThirdPartyPricing ?? false,
      windows: (input.windows ?? []).map((w) => ({ ...w, id: randomUUID() })),
      marketplaceId: input.marketplaceId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.save(product);
  }
}
