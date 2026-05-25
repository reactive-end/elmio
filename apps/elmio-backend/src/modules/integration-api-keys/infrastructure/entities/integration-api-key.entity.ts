import { randomUUID } from 'node:crypto';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Credencial de integracion por banco e integracion externa.
 */
@Entity('integration_api_keys')
export class IntegrationApiKeyEntity {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @Column({ type: 'varchar', length: 100 })
  bank!: string;

  @Column({ type: 'varchar', length: 120 })
  integration!: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  environment!: string | null;

  @Column({ type: 'varchar', length: 160 })
  name!: string;

  @Column({ type: 'text' })
  encryptedValue!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastRotatedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
