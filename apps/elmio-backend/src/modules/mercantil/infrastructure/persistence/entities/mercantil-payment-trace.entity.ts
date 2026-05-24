import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';
import {
  MercantilTraceStage,
  MercantilTraceStatus,
} from '../../../application/types/mercantil-persistence.types';

@Entity('mercantil_payment_traces')
export class MercantilPaymentTraceEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  shopcartId: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  clientId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 20, nullable: true })
  dniType: string | null;

  @Index()
  @Column({ type: 'varchar', length: 50, nullable: true })
  dniNumber: string | null;

  @Column({ type: 'varchar', length: 50 })
  stage: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'varchar', length: 500 })
  message: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  errorCode: string | null;

  @Column({ type: 'text', nullable: true })
  errorStack: string | null;

  @Column({ type: 'simple-json', nullable: true })
  payload: Record<string, unknown> | null;

  @Column({ type: 'simple-json', nullable: true })
  response: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
