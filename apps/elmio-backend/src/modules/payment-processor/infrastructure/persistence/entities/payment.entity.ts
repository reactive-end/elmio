import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { BankAccount } from './bank-account.entity'
import { Currency } from './currency.entity'

@Entity({ schema: 'payments', name: 'payment' })
/**
 * Entidad que representa una transacción de pago persistida.
 *
 * Consolida datos financieros, referencias y metadatos operativos
 * para trazabilidad y auditoría.
 */
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'amount_bs', type: 'decimal', precision: 15, scale: 2 })
  amountBs: number

  @Column({
    name: 'amount_usd',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountUsd: number

  @Column({ name: 'reference', type: 'varchar', length: 100, nullable: true })
  reference: string | null

  @Column({ name: 'billing_id', type: 'varchar', length: 100 })
  billingId: string

  @Column({ name: 'payment_date', type: 'timestamp with time zone' })
  paymentDate: Date

  @ManyToOne(() => BankAccount, (account) => account.outgoingPayments, {
    nullable: true,
  })
  @JoinColumn({ name: 'internal_source_account_id' })
  internalSourceAccount: BankAccount | null

  @Column({
    name: 'external_source_bank_code',
    type: 'varchar',
    length: 4,
    nullable: true,
  })
  externalSourceBankCode: string | null

  @Column({
    name: 'external_source_account',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  externalSourceAccount: string | null

  @Column({
    name: 'external_source_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  externalSourcePhone: string | null

  @Column({
    name: 'external_source_doc_type',
    type: 'char',
    length: 1,
    nullable: true,
  })
  externalSourceDocType: string | null

  @Column({
    name: 'external_source_doc',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  externalSourceDoc: string | null

  @ManyToOne(() => BankAccount, (account) => account.incomingPayments, {
    nullable: true,
  })
  @JoinColumn({ name: 'internal_dest_account_id' })
  internalDestinationAccount: BankAccount | null

  @Column({
    name: 'external_dest_bank_code',
    type: 'varchar',
    length: 4,
    nullable: true,
  })
  externalDestBankCode: string | null

  @Column({
    name: 'external_dest_account',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  externalDestAccount: string | null

  @Column({
    name: 'external_dest_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  externalDestPhone: string | null

  @Column({
    name: 'external_dest_doc_type',
    type: 'char',
    length: 1,
    nullable: true,
  })
  externalDestDocType: string | null

  @Column({
    name: 'external_dest_doc',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  externalDestDoc: string | null

  @Column({
    name: 'payer_user_id',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Identificador de usuario en base de datos externa',
  })
  payerUserId: string | null

  @Column({ name: 'payer_name', type: 'varchar', length: 150, nullable: true })
  payerName: string | null

  @Column({
    name: 'enterprise_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  enterpriseId: string | null

  @Column({ name: 'payment_status_id', type: 'integer' })
  paymentStatusId: number

  @Column({ name: 'payment_method_id', type: 'integer' })
  paymentMethodId: number

  @Column({ name: 'payment_type_id', type: 'integer', nullable: true })
  paymentTypeId: number | null

  @ManyToOne(() => Currency, (currency) => currency.payments, {
    nullable: false,
  })
  @JoinColumn({ name: 'currency_id' })
  currency: Currency

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date
}
