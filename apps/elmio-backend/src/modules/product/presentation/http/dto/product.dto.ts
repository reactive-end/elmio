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
  hasStock?: boolean;
  currentStock!: number;
  minimumStock!: number;
  hasValidity!: boolean;
  validFrom!: string | null;
  validTo!: string | null;
  attributes!: ProductAttribute[];
  priceLists!: Omit<PriceList, 'id'>[];
  discounts!: Omit<DiscountPeriod, 'id'>[];
  paymentMode!: PaymentMode;
  paymentPeriod?: string | null;
  maxQuotas!: number;
  interestType?: 'none' | 'percentage' | 'fixed';
  interestRate!: number;
  initialPayment?: number;
  usesThirdPartyPricing!: boolean;
  globalThirdPartyProvider?: string | null;
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
  hasStock?: boolean;
  currentStock?: number;
  minimumStock?: number;
  hasValidity?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  attributes?: ProductAttribute[];
  priceLists?: PriceList[];
  discounts?: DiscountPeriod[];
  paymentMode?: PaymentMode;
  paymentPeriod?: string | null;
  maxQuotas?: number;
  interestType?: 'none' | 'percentage' | 'fixed';
  interestRate?: number;
  initialPayment?: number;
  usesThirdPartyPricing?: boolean;
  globalThirdPartyProvider?: string | null;
  windows?: ProductWindow[];
  marketplaceId?: string | null;
}
