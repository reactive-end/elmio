import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EnterpriseEntity } from './enterprise.entity';
import { PersonProfileEntity } from './person-profile.entity';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @ManyToOne(() => EnterpriseEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterpriseId' })
  enterprise!: EnterpriseEntity | null;

  @Column({ type: 'uuid', nullable: true })
  enterpriseId!: string | null;

  @ManyToOne(() => PersonProfileEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'collaboratorId' })
  collaborator!: PersonProfileEntity | null;

  @Column({ type: 'uuid', nullable: true })
  collaboratorId!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'payment' })
  kind!: 'payment' | 'charge';

  @Column({ type: 'text' })
  concept!: string;

  @Column({ type: 'float', default: 0 })
  amount!: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: 'paid' | 'pending' | 'failed';

  @Column({ type: 'varchar', length: 100 })
  date!: string;

  /**
   * Metodo de pago con el que se registro esta transaccion.
   * `r4_immediate_debit` = debito inmediato C2P contra el cliente.
   * `r4_transfer` = transferencia bancaria (cuando la spec de R4 este
   * disponible, la conciliacion puede ser sincrona).
   * Null para transacciones historicas previas a la migracion 0011.
   */
  @Index()
  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  paymentMethod!: 'r4_immediate_debit' | 'r4_transfer' | null;

  /**
   * Referencia bancaria devuelta por R4 (o capturada del comprobante
   * de transferencia). Se persiste para trazabilidad.
   */
  @Column({
    name: 'payment_reference',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  paymentReference!: string | null;

  /**
   * URL del comprobante de transferencia subido a Google Cloud Storage.
   * Solo se setea cuando `paymentMethod = 'r4_transfer'` (o en su version
   * manual si la conciliacion es por comprobante del cliente).
   */
  @Column({ name: 'transfer_receipt_url', type: 'text', nullable: true })
  transferReceiptUrl!: string | null;

  /**
   * Timestamp de conciliacion realizada por finanzas. Null mientras
   * el comprobante este pendiente de verificacion.
   */
  @Column({
    name: 'transfer_verified_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  transferVerifiedAt!: Date | null;

  /**
   * FK logica al Purchase que este pago (parcial) esta saldando.
   * Null para transacciones que NO son abonos parciales (cobros
   * normales o pagos completos).
   */
  @Index()
  @Column({ name: 'applied_to_purchase_id', type: 'uuid', nullable: true })
  appliedToPurchaseId!: string | null;
}
