import { randomUUID } from 'node:crypto'
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { BankAccount } from './bank-account.entity'

/**
 * Entidad que representa un conjunto de API keys asociado a una cuenta bancaria.
 *
 * Almacena hasta tres claves de acceso:
 * - `commerceKey` (principal/commerce): obligatoria.
 * - `secretKey` (secundaria/secret): opcional.
 * - `extraKey` (extra): opcional.
 */
@Entity({ schema: 'payments', name: 'api_key' })
export class ApiKey {
  /** Identificador único de la API key (UUID v4). */
  @PrimaryColumn('uuid')
  id: string = randomUUID()

  /**
   * API key principal o de comercio.
   * Identifica al comercio ante el procesador de pagos.
   * En ocasione se proporciona un solo API key que cumple ambas funciones y es denominado 'secretkey', por eso se permite que `secretKey` sea opcional.
   */
  @Column({ name: 'commerce_key', type: 'varchar', length: 255 })
  commerceKey: string

  /**
   * API key secundaria o secreto del comercio.
   * Utilizada para firmar o validar solicitudes. Es opcional.
   */
  @Column({ name: 'secret_key', type: 'varchar', length: 255, nullable: true })
  secretKey: string | null

  /**
   * API key extra.
   * Campo de uso libre para integraciones que requieran una tercera clave. Es opcional.
   */
  @Column({ name: 'extra_key', type: 'varchar', length: 255, nullable: true })
  extraKey: string | null

  /** Indica si el conjunto de claves está activo. */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  /** Cuenta bancaria a la que pertenece este conjunto de claves. */
  @ManyToOne(() => BankAccount, { nullable: false, eager: false })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount: BankAccount

  /** Fecha de creación del registro. */
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date

  /** Fecha de última actualización del registro. */
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date
}
