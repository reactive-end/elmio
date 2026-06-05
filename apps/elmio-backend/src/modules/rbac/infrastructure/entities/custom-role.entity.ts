import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Representa un rol personalizado creado dinamicamente por un administrador.
 */
@Entity({ name: 'custom_roles' })
export class CustomRoleEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  key!: string; // Ej: 'SUPPORT_TECH'

  @Column({ type: 'varchar', length: 100 })
  name!: string; // Ej: "Soporte Técnico"

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
