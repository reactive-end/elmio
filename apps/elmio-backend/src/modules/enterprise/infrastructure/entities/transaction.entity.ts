import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { EnterpriseEntity } from './enterprise.entity';
import { PersonProfileEntity } from './person-profile.entity';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @ManyToOne(() => EnterpriseEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterpriseId' })
  enterprise!: EnterpriseEntity | null;

  @Column({ type: 'uuid', nullable: true })
  enterpriseId!: string | null;

  @ManyToOne(() => PersonProfileEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'collaboratorId' })
  collaborator!: PersonProfileEntity | null;

  @Column({ type: 'uuid', nullable: true })
  collaboratorId!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'payment' })
  kind!: 'payment' | 'charge';

  @Column({ type: 'text' })
  concept!: string;

  @Column({ type: 'float', default: 0 })
  amount!: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: 'paid' | 'pending' | 'failed';

  @Column({ type: 'varchar', length: 100 })
  date!: string;
}
