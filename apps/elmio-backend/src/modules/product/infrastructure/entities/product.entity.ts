import { Entity, Column, PrimaryColumn } from 'typeorm';
import {
  ProductAttribute,
  PriceList,
  DiscountPeriod,
  ProductWindow,
} from '../../domain/product';

// Transformador generico para columnas complejas en PostgreSQL/SQLite
const jsonTransformer = {
  to: (value: any) => (value ? JSON.stringify(value) : null),
  from: (value: string) => (value ? JSON.parse(value) : []),
};

@Entity('products')
export class ProductEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'varchar', length: 255 })
  category!: string;

  @Column({
    type: 'text',
    transformer: jsonTransformer,
  })
  tags!: string[];

  @Column({
    type: 'text',
    transformer: jsonTransformer,
  })
  images!: string[];

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'boolean', default: true })
  hasStock!: boolean;

  @Column({ type: 'int', default: 0 })
  currentStock!: number;

  @Column({ type: 'int', default: 0 })
  minimumStock!: number;

  @Column({ type: 'boolean', default: false })
  hasValidity!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  validFrom!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  validTo!: string | null;

  @Column({
    type: 'text',
    transformer: jsonTransformer,
  })
  attributes!: ProductAttribute[];

  @Column({
    type: 'text',
    transformer: jsonTransformer,
  })
  priceLists!: PriceList[];

  @Column({
    type: 'text',
    transformer: jsonTransformer,
  })
  discounts!: DiscountPeriod[];

  @Column({ type: 'varchar', length: 50 })
  paymentMode!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentPeriod!: string | null;

  @Column({ type: 'int', default: 0 })
  maxQuotas!: number;

  @Column({ type: 'varchar', length: 50, default: 'none' })
  interestType!: string;

  @Column({ type: 'float', default: 0 })
  interestRate!: number;

  @Column({ type: 'float', default: 0 })
  initialPayment!: number;

  @Column({ type: 'boolean', default: false })
  usesThirdPartyPricing!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  globalThirdPartyProvider!: string | null;

  @Column({
    type: 'text',
    transformer: jsonTransformer,
  })
  windows!: ProductWindow[];

  @Column({ type: 'uuid', nullable: true })
  marketplaceId!: string | null;

  @Column({ type: 'varchar', length: 100 })
  createdAt!: string;

  @Column({ type: 'varchar', length: 100 })
  updatedAt!: string;
}

