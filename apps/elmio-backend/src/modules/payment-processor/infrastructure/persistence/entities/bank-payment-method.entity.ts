import { randomUUID } from 'node:crypto'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'
import { Bank } from './bank.entity'
import { PaymentMethod } from './payment-method.entity'

@Entity({ name: 'bank_payment_method' })
@Unique('UQ_bank_payment_method_bank_method', ['bank', 'paymentMethod'])
/**
 * Entidad pivote para disponibilidad de métodos de pago por banco.
 *
 * @example
 * const availability = { isActive: true, isExternal: false }
 */
export class BankPaymentMethod {
  @PrimaryColumn('uuid')
  id: string = randomUUID()

  @ManyToOne(() => Bank, (bank) => bank.bankPaymentMethods, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bank_id' })
  bank: Bank

  @ManyToOne(
    () => PaymentMethod,
    (paymentMethod) => paymentMethod.bankPaymentMethods,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @Column({ name: 'is_external', type: 'boolean', default: false })
  isExternal: boolean

  @Column({
    name: 'external_provider',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  externalProvider: string | null

  @Column({ name: 'external_metadata', type: 'jsonb', nullable: true })
  externalMetadata: Record<string, unknown> | null

  @Column({ name: 'config', type: 'jsonb', nullable: true })
  config: Record<string, unknown> | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date
}
