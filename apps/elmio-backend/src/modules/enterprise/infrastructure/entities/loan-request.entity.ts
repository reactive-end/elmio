import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { EnterpriseEntity } from './enterprise.entity';
import { PersonProfileEntity } from './person-profile.entity';

@Entity('loan_requests')
export class LoanRequestEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @ManyToOne(() => EnterpriseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterpriseId' })
  enterprise!: EnterpriseEntity;

  @Column({ type: 'uuid' })
  enterpriseId!: string;

  @ManyToOne(() => PersonProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collaboratorId' })
  collaborator!: PersonProfileEntity;

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
  status!: 'pending' | 'company_approved' | 'approved' | 'acquired' | 'disbursed' | 'denied';

  @Column({ type: 'text', nullable: true })
  denialReason!: string | null;

  @Column({ type: 'varchar', length: 100 })
  createdAt!: string;

  @Column({ type: 'varchar', length: 100 })
  updatedAt!: string;
}
