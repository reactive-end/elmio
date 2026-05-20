import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  enterpriseId!: string;

  @Column({ type: 'text' })
  concept!: string;

  @Column({ type: 'float', default: 0 })
  amount!: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: 'paid' | 'pending' | 'failed';

  @Column({ type: 'varchar', length: 100 })
  date!: string;
}
