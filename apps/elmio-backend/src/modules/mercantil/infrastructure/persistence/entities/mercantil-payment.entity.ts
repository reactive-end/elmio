/**
 * Entidad de persistencia para pagos/domiciliación de Mercantil
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

export type PaymentMethodType = 'debito' | 'domiciliacion_tarjeta' | 'domiciliacion_cuenta' | 'none';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

@Entity('mercantil_payments')
export class MercantilPaymentEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  shopcartId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  clientId: string | null;

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: PaymentMethodType;

  @Column({ type: 'varchar', length: 20, nullable: true })
  payerDocType: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payerDocNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  payerFirstName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  payerLastName: string | null;

  // --- Débito ---
  @Column({ type: 'varchar', length: 20, nullable: true })
  debitBankCode: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  debitValidationType: string | null; // 'T' o 'C'

  @Column({ type: 'varchar', length: 50, nullable: true })
  debitPayerIdentifier: string | null; // teléfono o cuenta

  @Column({ type: 'varchar', length: 20, nullable: true })
  debitToken: string | null;

  // --- Domiciliación Tarjeta ---
  @Column({ type: 'varchar', length: 50, nullable: true })
  cardNumber: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  cardExpiryDate: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cardBankCode: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cardType: string | null; // debito/credito

  // --- Domiciliación Cuenta ---
  @Column({ type: 'varchar', length: 20, nullable: true })
  accountPhone: string | null;

  @Column({ type: 'simple-json', nullable: true })
  selectedBanks: string[] | null;

  // --- Monto y estado ---
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount: number | null;

  @Column({ type: 'varchar', length: 50 })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  concept: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  provider: string | null;

  @Column({ type: 'simple-json', nullable: true })
  rawData: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
