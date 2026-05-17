import type {
  ProductType,
  PaymentMode,
  ProductAttribute,
  ProductWindow,
  PriceList,
  DiscountPeriod,
} from '../../../domain/product';

/**
 * DTO para crear un producto.
 */
export class CreateProductDto {
  sku!: string;
  name!: string;
  description!: string;
  type!: ProductType;
  category!: string;
  tags!: string[];
  images!: string[];
  currentStock!: number;
  minimumStock!: number;
  hasValidity!: boolean;
  validFrom!: string | null;
  validTo!: string | null;
  attributes!: ProductAttribute[];
  priceLists!: Omit<PriceList, 'id'>[];
  discounts!: Omit<DiscountPeriod, 'id'>[];
  paymentMode!: PaymentMode;
  maxQuotas!: number;
  interestRate!: number;
  usesThirdPartyPricing!: boolean;
  windows!: Omit<ProductWindow, 'id'>[];
  marketplaceId!: string | null;
}

/**
 * DTO para actualizar un producto (todos los campos opcionales).
 */
export class UpdateProductDto {
  name?: string;
  description?: string;
  type?: ProductType;
  category?: string;
  tags?: string[];
  images?: string[];
  active?: boolean;
  currentStock?: number;
  minimumStock?: number;
  hasValidity?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  attributes?: ProductAttribute[];
  priceLists?: PriceList[];
  discounts?: DiscountPeriod[];
  paymentMode?: PaymentMode;
  maxQuotas?: number;
  interestRate?: number;
  usesThirdPartyPricing?: boolean;
  windows?: ProductWindow[];
  marketplaceId?: string | null;
}
