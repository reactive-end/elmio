import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Configuracion de interes global por empresa.
 */
@Entity('enterprise_interest_configs')
export class EnterpriseInterestConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
