import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';
import {
  MercantilPaymentFrequency,
  MercantilPolicyStatus,
} from '../../../application/types/mercantil-persistence.types';

@Entity('mercantil_policies')
export class MercantilPolicyEntity {
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

  @Index()
  @Column({ type: 'varchar', length: 100 })
  policyId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  policyNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  number: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  entity: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  area: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  certificateNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentFrequency: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  assuredSum: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  quotedAmount: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  annualPremium: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  startDate: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  endDate: string | null;

  @Column({ type: 'simple-json', nullable: true })
  rawData: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
