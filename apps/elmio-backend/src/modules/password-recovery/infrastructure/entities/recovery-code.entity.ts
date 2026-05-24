import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Entidad TypeORM que representa la tabla `recovery_codes`.
 * Almacena los codigos de recuperacion de contrasena generados para los usuarios.
 */
@Entity('recovery_codes')
export class RecoveryCodeEntity {
  /** Identificador unico del codigo de recuperacion. */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** ID del usuario al que pertenece el codigo. */
  @Column({ type: 'varchar', length: 255 })
  userId!: string;

  /** Hash del codigo de recuperacion (HMAC-SHA256). */
  @Column({ type: 'varchar', length: 255 })
  codeHash!: string;

  /** Fecha y hora de expiracion del codigo. */
  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  /** Indica si el codigo ya fue utilizado. */
  @Column({ type: 'boolean', default: false })
  used!: boolean;

  /** Fecha de creacion en formato ISO 8601. */
  @Column({ type: 'varchar', length: 100 })
  createdAt!: string;
}
