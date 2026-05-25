import { randomUUID } from 'node:crypto'
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm'
import { BankAccount } from './bank-account.entity'
import { Payment } from './payment.entity'
import { ExchangeRate } from './exchange-rate.entity'

@Entity({ name: 'currency' })
/**
 * Entidad que modela una moneda disponible para el dominio de pagos.
 *
 * Se usa como catálogo transversal para cuentas, pagos y tasas de cambio.
 */
export class Currency {
  @PrimaryColumn('uuid')
  id: string = randomUUID()

  @Column({
    name: 'name',
    type: 'varchar',
    length: 50,
    comment: 'Nombre visible de la moneda (ej. Dólar, Bolívar)',
  })
  name: string

  @Column({
    name: 'code',
    type: 'varchar',
    length: 3,
    unique: true,
    comment: 'Código ISO de la moneda (ej. USD, VES)',
  })
  code: string

  @Column({
    name: 'symbol',
    type: 'varchar',
    length: 5,
    comment: 'Símbolo de la moneda (ej. $, Bs.)',
  })
  symbol: string

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @OneToMany(() => BankAccount, (account) => account.currency)
  bankAccounts: BankAccount[]

  @OneToMany(() => Payment, (payment) => payment.currency)
  payments: Payment[]

  @OneToMany(() => ExchangeRate, (exchangeRate) => exchangeRate.currency)
  exchangeRates: ExchangeRate[]

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date
}
