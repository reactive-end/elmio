import { randomUUID } from 'node:crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BankAccount } from './bank-account.entity';
import { BankPaymentMethod } from './bank-payment-method.entity';

@Entity({ name: 'bank' })
export class Bank {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @Column({ name: 'bank_code', type: 'varchar', length: 4, unique: true })
  bankCode: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 120, unique: true })
  bankName: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => BankAccount, (account) => account.bank)
  bankAccounts: BankAccount[];

  @OneToMany(
    () => BankPaymentMethod,
    (bankPaymentMethod: BankPaymentMethod) => bankPaymentMethod.bank,
  )
  bankPaymentMethods: BankPaymentMethod[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
