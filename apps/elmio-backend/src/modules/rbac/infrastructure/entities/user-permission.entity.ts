import { randomUUID } from 'node:crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

/**
 * Configuracion de visibilidad de un grupo de la sidebar personalizada para un usuario especifico.
 */
@Entity({ name: 'user_permissions' })
@Unique('UQ_user_permissions_user_groupKey', ['userId', 'groupKey'])
export class UserPermissionEntity {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 100 })
  groupKey!: string;

  @Column({ type: 'boolean', default: true })
  visible!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
