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
 *
 * A partir de la migracion 0011 soporta el modulo de cobranza:
 *  - amount_due / amount_paid / due_date: abonos parciales y calculo
 *    de saldo insoluto.
 *  - delinquency_bucket / overdue_since: clasificacion diaria de
 *    morosidad calculada por el job CRON.
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
  status!:
    | 'pending'
    | 'paid'
    | 'financed'
    | 'disbursed'
    | 'cancelled'
    | 'partially_paid';

  /**
   * Monto total adeudado. Para purchases historicos espeja `amountUsd`.
   * A partir de la migracion 0011 puede divergir cuando hay abonos
   * parciales (la diferencia entre amount_due y amount_paid es el saldo
   * insoluto).
   */
  @Column({
    name: 'amount_due',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  amountDue!: number | null;

  /**
   * Acumulado de pagos parciales aplicados a este purchase. Inicia en 0.
   * El job de conciliacion lo actualiza al verificar abonos.
   */
  @Column({
    name: 'amount_paid',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountPaid!: number;

  /**
   * Fecha de vencimiento del cargo. Si pasa y `amount_paid < amount_due`,
   * el purchase pasa al bucket de morosidad correspondiente.
   */
  @Index()
  @Column({
    name: 'due_date',
    type: 'timestamp with time zone',
    nullable: true,
  })
  dueDate!: Date | null;

  /**
   * Bucket de morosidad calculado diariamente por el job CRON.
   *  - 'current'    : al dia (dias vencidos <= 0 o ya saldado)
   *  - 'overdue_30' : 1 a 30 dias de mora
   *  - 'overdue_60' : 31 a 60 dias
   *  - 'overdue_90' : 61 a 90 dias
   *  - 'legal'      : mas de 90 dias (cobranza legal)
   * Null para purchases saldados o sin fecha de vencimiento asignada.
   */
  @Index()
  @Column({
    name: 'delinquency_bucket',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  delinquencyBucket!:
    | 'current'
    | 'overdue_30'
    | 'overdue_60'
    | 'overdue_90'
    | 'legal'
    | null;

  /**
   * Fecha desde la cual el cargo entro en mora. Se setea la primera
   * vez que el job detecta que `dueDate < now && amount_paid < amount_due`.
   * No se resetea aunque el bucket cambie de nivel; sirve para calcular
   * dias vencidos de forma estable.
   */
  @Column({
    name: 'overdue_since',
    type: 'timestamp with time zone',
    nullable: true,
  })
  overdueSince!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
