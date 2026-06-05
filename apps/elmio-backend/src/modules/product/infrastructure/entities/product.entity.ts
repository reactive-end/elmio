import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import {
  ProductAttribute,
  PriceList,
  DiscountPeriod,
  ProductWindow,
  ProductAction,
  FinancingScheme,
} from '../../domain/product';
import { MarketplaceEntity } from '@/modules/marketplace/infrastructure/entities/marketplace.entity';

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

  @Column({
    type: 'text',
    transformer: jsonTransformer,
    nullable: true,
  })
  financingSchemes!: FinancingScheme[];

  @Column({ type: 'varchar', length: 50, default: 'none' })
  interestType!: string;

  @Column({ type: 'float', default: 0 })
  interestRate!: number;

  @Column({ type: 'boolean', default: false })
  usesThirdPartyPricing!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  globalThirdPartyProvider!: string | null;

  @Column({
    type: 'text',
    transformer: jsonTransformer,
  })
  windows!: ProductWindow[];

  @ManyToOne(() => MarketplaceEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'marketplaceId' })
  marketplace!: MarketplaceEntity | null;

  @Column({ type: 'uuid', nullable: true })
  marketplaceId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  alternativeBankAccountId!: string | null;

  @Column({
    type: 'text',
    transformer: jsonTransformer,
    nullable: true,
  })
  actions!: ProductAction[] | null;

  @Column({ type: 'varchar', length: 100 })
  createdAt!: string;

  @Column({ type: 'varchar', length: 100 })
  updatedAt!: string;
}
