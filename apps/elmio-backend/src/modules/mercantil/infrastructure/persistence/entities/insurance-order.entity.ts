import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Entidad unificada de base de datos para almacenar snapshots de cotizaciones,
 * emisiones y estados de órdenes de seguro (insurance_orders) de forma genérica
 * y escalable utilizando campos JSONB.
 */
@Entity('insurance_orders')
export class InsuranceOrderEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  shopcartId!: string;

  @Column({ type: 'varchar', length: 100 })
  provider!: string;

  @Column({ type: 'varchar', length: 50 })
  status!: string;

  @Column({ type: 'jsonb', nullable: true })
  clientSnapshot?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  vehicleSnapshot?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  policiesSnapshot?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  paymentSnapshot?: Record<string, unknown> | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
