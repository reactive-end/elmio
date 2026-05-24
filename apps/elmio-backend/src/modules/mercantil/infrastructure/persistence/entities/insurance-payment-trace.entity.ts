import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

/**
 * Entidad unificada para registrar logs técnicos de auditoría, payloads
 * y respuestas de consumo de APIs externas de seguros y pasarelas de pago.
 */
@Entity('insurance_payment_traces')
export class InsurancePaymentTraceEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index('IDX_insurance_payment_traces_shopcartId')
  @Column({ type: 'varchar', length: 100 })
  shopcartId!: string;

  @Index('IDX_insurance_payment_traces_provider')
  @Column({ type: 'varchar', length: 100 })
  provider!: string;

  @Column({ type: 'varchar', length: 50 })
  stage!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @Column({ type: 'varchar', length: 500 })
  message!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  errorCode?: string | null;

  @Column({ type: 'text', nullable: true })
  errorStack?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  response?: Record<string, unknown> | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
