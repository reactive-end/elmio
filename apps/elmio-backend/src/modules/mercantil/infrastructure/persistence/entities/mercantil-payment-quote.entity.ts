/**
 * Entidad de persistencia para cuotas de pago de Mercantil
 * @module mercantil/infrastructure/persistence/entities
 */

import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';

@Entity('mercantil_payment_quotes')
export class MercantilPaymentQuoteEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  shopcartId: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  policyId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  policyNumber: string | null;

  @Column({ type: 'varchar', length: 100 })
  quote: string;

  @Column({ type: 'int', nullable: true })
  agreement: number | null;

  @Column({ type: 'int', nullable: true })
  receipt: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  receiptStatus: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  quoteStatus: string | null;

  @Column({ type: 'boolean', default: false })
  isNextDuePayment: boolean;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  expirationDate: string | null;

  @Column({ type: 'simple-json', nullable: true })
  rawData: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
