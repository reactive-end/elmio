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
 * Configuracion de visibilidad de un grupo de la sidebar para un rol.
 */
@Entity({ name: 'role_permissions' })
@Unique('UQ_role_permissions_role_groupKey', ['role', 'groupKey'])
export class RolePermissionEntity {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @Column({ type: 'varchar', length: 50 })
  role!: string;

  @Column({ type: 'varchar', length: 100 })
  groupKey!: string;

  @Column({ type: 'boolean', default: true })
  visible!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
