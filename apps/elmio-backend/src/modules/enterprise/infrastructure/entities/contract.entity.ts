import { Column, Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { EnterpriseEntity } from './enterprise.entity';

@Entity('contracts')
export class ContractEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @ManyToOne(() => EnterpriseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterpriseId' })
  enterprise!: EnterpriseEntity;

  @Column({ type: 'uuid' })
  enterpriseId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  createdAt!: string;
}
