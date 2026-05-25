import { randomUUID } from 'node:crypto'
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { BankPaymentMethod } from './bank-payment-method.entity'

@Entity({ name: 'payment_method' })
/**
 * Entidad de catálogo para métodos de pago disponibles.
 *
 * @example
 * const method = { code: 'p2p', name: 'Pago Móvil P2P', isActive: true }
 */
export class PaymentMethod {
  @PrimaryColumn('uuid')
  id: string = randomUUID()

  @Column({ name: 'code', type: 'varchar', length: 40, unique: true })
  code: string

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name: string

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @OneToMany(
    () => BankPaymentMethod,
    (bankPaymentMethod) => bankPaymentMethod.paymentMethod,
  )
  bankPaymentMethods: BankPaymentMethod[]

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date
}
