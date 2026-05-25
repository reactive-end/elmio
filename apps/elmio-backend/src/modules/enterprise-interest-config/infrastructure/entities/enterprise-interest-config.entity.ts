import { randomUUID } from 'node:crypto';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EnterpriseEntity } from '@/modules/enterprise/infrastructure/entities/enterprise.entity';

/**
 * Configuracion de interes global por empresa.
 */
@Entity('enterprise_interest_configs')
export class EnterpriseInterestConfigEntity {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @ManyToOne(() => EnterpriseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterpriseId' })
  enterprise!: EnterpriseEntity;

  @Column({ type: 'uuid', unique: true })
  enterpriseId!: string;

  @Column({ type: 'varchar', length: 20, default: 'none' })
  interestType!: 'none' | 'percentage' | 'fixed';

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  interestRate!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
