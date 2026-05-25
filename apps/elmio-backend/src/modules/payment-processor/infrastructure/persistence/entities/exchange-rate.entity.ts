import { randomUUID } from 'node:crypto'
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm'
import { Currency } from './currency.entity'

@Entity({ name: 'exchange_rate' })
@Unique('UQ_exchange_rate_currency_effective_date', [
  'currency',
  'effectiveDate',
])
/**
 * Entidad para almacenar tasas de cambio diarias por moneda.
 *
 * Registra el valor equivalente en bolívares por dólar
 * para una fecha efectiva determinada.
 */
export class ExchangeRate {
  @PrimaryColumn('uuid')
  id: string = randomUUID()

  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate: Date

  @ManyToOne(() => Currency, (currency) => currency.exchangeRates, {
    nullable: false,
  })
  @JoinColumn({ name: 'currency_id' })
  currency: Currency

  @Column({
    name: 'bolivares_per_usd',
    type: 'decimal',
    precision: 14,
    scale: 4,
  })
  bolivaresPerUsd: number

  @Column({ name: 'source', type: 'varchar', length: 50, nullable: true })
  source: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date
}
