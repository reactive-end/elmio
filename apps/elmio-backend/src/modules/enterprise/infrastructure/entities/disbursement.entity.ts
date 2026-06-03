import { randomUUID } from 'node:crypto'
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

/**
 * Registro de desembolso manual ejecutado por un usuario de finanzas
 * para acreditar fondos a un colaborador via Credito Inmediato R4.
 */
@Entity('disbursement')
export class DisbursementEntity {
  @PrimaryColumn('uuid')
  id: string = randomUUID()

  @Column({ type: 'uuid' })
  loanRequestId!: string

  @Column({ type: 'uuid' })
  paymentId!: string

  @Column({ type: 'varchar', length: 36 })
  financeUserId!: string

  @Column({ type: 'varchar', length: 255 })
  financeUserName!: string

  @Column({ name: 'amount_usd', type: 'decimal', precision: 10, scale: 2 })
  amountUsd!: number

  @Column({ name: 'amount_bs', type: 'decimal', precision: 15, scale: 2 })
  amountBs!: number

  @Column({ name: 'exchange_rate', type: 'decimal', precision: 15, scale: 4 })
  exchangeRate!: number

  @Column({ name: 'bank_code', type: 'varchar', length: 4 })
  bankCode!: string

  @Column({ name: 'account_number', type: 'varchar', length: 20 })
  accountNumber!: string

  @Column({ name: 'phone_number', type: 'varchar', length: 20 })
  phoneNumber!: string

  @Column({ name: 'document_id', type: 'varchar', length: 20 })
  documentId!: string

  @Column({ type: 'text' })
  concept!: string

  @Column({ name: 'bank_reference', type: 'varchar', length: 100, nullable: true })
  bankReference!: string | null

  @Column({ name: 'bank_operation_id', type: 'varchar', length: 100, nullable: true })
  bankOperationId!: string | null

  @Column({ type: 'varchar', length: 20, default: 'success' })
  status!: 'success' | 'failed'

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date
}
