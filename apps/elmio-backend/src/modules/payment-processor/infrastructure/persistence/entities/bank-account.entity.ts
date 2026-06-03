import { randomUUID } from 'node:crypto'
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Payment } from './payment.entity'
import { Currency } from './currency.entity'
import { BankAccountType } from './bank-account-type.entity'
import { Bank } from './bank.entity'

@Entity({ name: 'bank_account' })
/**
 * Entidad que representa una cuenta bancaria del dominio de pagos.
 *
 * Puede utilizarse como cuenta origen o destino en operaciones
 * de pago y transferencias.
 */
export class BankAccount {
  @PrimaryColumn('uuid')
  id: string = randomUUID()

  @ManyToOne(() => Bank, (bank) => bank.bankAccounts, {
    nullable: false,
    eager: false,
  })
  @JoinColumn({ name: 'bank_id' })
  bank: Bank

  @Column({
    name: 'numero_cuenta',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  accountNumber: string

  @Column({ name: 'tipo_documento', type: 'char', length: 1 })
  documentType: string

  @Column({ name: 'documento', type: 'varchar', length: 20 })
  documentNumber: string

  @Column({
    name: 'telefono_pago_movil',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Teléfono para pago móvil',
  })
  phoneNumber: string

  @Column({
    name: 'telefono_validacion',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Teléfono usado para validación adicional',
  })
  phoneValidationNumber: string

  @Column({
    name: 'razon_social',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Razón social del titular (nombre o razón social)',
  })
  businessName: string

  @ManyToOne(() => BankAccountType, (accountType) => accountType.bankAccounts, {
    nullable: true,
    eager: false,
  })
  @JoinColumn({
    name: 'account_type_id',
    foreignKeyConstraintName: 'FK_bank_account_account_type_id',
  })
  accountType: BankAccountType

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  description: string

  @OneToMany(() => Payment, (payment) => payment.internalSourceAccount)
  outgoingPayments: Payment[]

  @OneToMany(() => Payment, (payment) => payment.internalDestinationAccount)
  incomingPayments: Payment[]

  @ManyToOne(() => Currency, (currency) => currency.bankAccounts, {
    nullable: false,
  })
  @JoinColumn({ name: 'currency_id' })
  currency: Currency

  @Column({ name: 'role', type: 'varchar', length: 20, default: 'RECEPTOR' })
  role: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date
}
