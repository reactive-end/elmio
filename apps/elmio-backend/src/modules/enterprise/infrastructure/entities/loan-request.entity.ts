import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('loan_requests')
export class LoanRequestEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  enterpriseId!: string;

  @Column({ type: 'uuid' })
  collaboratorId!: string;

  @Column({ type: 'varchar', length: 255 })
  collaboratorName!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: 'advance' | 'loan' | 'permission' | 'other';

  @Column({ type: 'float', default: 0 })
  amount!: number;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: 'pending' | 'approved' | 'denied';

  @Column({ type: 'text', nullable: true })
  denialReason!: string | null;

  @Column({ type: 'varchar', length: 100 })
  createdAt!: string;

  @Column({ type: 'varchar', length: 100 })
  updatedAt!: string;
}
