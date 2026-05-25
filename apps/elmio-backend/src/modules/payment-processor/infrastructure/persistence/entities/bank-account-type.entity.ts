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

@Entity({ schema: 'payments', name: 'bank_account_type' })
/**
 * Entidad catálogo para los tipos de cuentas bancarias.
 *
 * Centraliza los tipos disponibles (ej. Corriente, Ahorro) para
 * que las cuentas bancarias los referencien por id.
 */
export class BankAccountType {
  @PrimaryColumn('uuid')
  id: string = randomUUID()

  @Column({
    name: 'tipo_cuenta',
    type: 'varchar',
    length: 50,
    unique: true,
    comment: 'Tipo de cuenta bancaria (ej. Corriente, Ahorro)',
  })
  accountType: string

  @OneToMany(() => BankAccount, (account) => account.accountType)
  bankAccounts: BankAccount[]

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date
}
