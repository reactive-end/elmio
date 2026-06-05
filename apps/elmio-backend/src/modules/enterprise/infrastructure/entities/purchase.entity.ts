import { randomUUID } from 'node:crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Compra/orden registrada en el sistema. Se crea al confirmarse el pago
 * (marketplace) o al desembolsarse (R4 o Plaza). Sirve como registro
 * unificado de traza para todas las operaciones de compra.
 */
@Entity('purchases')
export class PurchaseEntity {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @Index()
  @Column({ name: 'purchaser_type', type: 'varchar', length: 20 })
  purchaserType!: 'natural_client' | 'collaborator' | 'enterprise';

  @Index()
  @Column({ name: 'purchaser_id', type: 'uuid' })
  purchaserId!: string;

  @Column({ name: 'purchaser_name', type: 'varchar', length: 255 })
  purchaserName!: string;

  @Column({
    name: 'purchaser_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  purchaserEmail!: string | null;

  @Column({
    name: 'purchaser_document',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  purchaserDocument!: string | null;

  @Index()
  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @Column({ name: 'product_name', type: 'varchar', length: 255 })
  productName!: string;

  @Column({ name: 'product_sku', type: 'varchar', length: 100, nullable: true })
  productSku!: string | null;

  @Column({ name: 'marketplace_id', type: 'uuid', nullable: true })
  marketplaceId!: string | null;

  @Column({
    name: 'marketplace_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  marketplaceName!: string | null;

  @Column({ name: 'amount_usd', type: 'decimal', precision: 10, scale: 2 })
  amountUsd!: number;

  @Column({
    name: 'amount_ves',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  amountVes!: number | null;

  @Column({
    name: 'exchange_rate',
    type: 'decimal',
    precision: 15,
    scale: 4,
    nullable: true,
  })
  exchangeRate!: number | null;

  @Column({ name: 'is_financed', type: 'boolean', default: false })
  isFinanced!: boolean;

  @Column({ type: 'int', nullable: true })
  installments!: number | null;

  @Column({
    name: 'interest_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  interestRate!: number | null;

  @Column({ type: 'varchar', length: 30 })
  channel!: 'marketplace' | 'loan_request' | 'insurance';

  @Index()
  @Column({ name: 'transaction_id', type: 'uuid', nullable: true })
  transactionId!: string | null;

  @Index()
  @Column({ name: 'loan_request_id', type: 'uuid', nullable: true })
  loanRequestId!: string | null;

  @Column({ name: 'disbursement_id', type: 'uuid', nullable: true })
  disbursementId!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: 'pending' | 'paid' | 'financed' | 'disbursed' | 'cancelled';

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
