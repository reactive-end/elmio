import { Entity, Column, PrimaryColumn } from 'typeorm';
import { UserRole } from '../../domain/user';

/**
 * Entidad de base de datos para la persistencia relacional de usuarios con TypeORM.
 */
@Entity('users')
export class UserEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 50 })
  role!: UserRole;

  @Column({ type: 'varchar', length: 255 })
  owner!: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  slug!: string | null;

  @Column({ type: 'varchar', length: 10, default: '+58' })
  countryCode!: string;

  @Column({ type: 'varchar', length: 50, default: '' })
  phone!: string;

  @Column({ type: 'varchar', length: 100 })
  createdAt!: string;

  @Column({ type: 'boolean', default: false })
  requirePasswordChange!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
