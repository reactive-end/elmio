import { Column, Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ContractEntity } from './contract.entity';

@Entity('contract_files')
export class ContractFileEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @ManyToOne(() => ContractEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contractId' })
  contract!: ContractEntity;

  @Column({ type: 'uuid' })
  contractId!: string;

  @Column({ type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ type: 'varchar', length: 150 })
  mimeType!: string;

  @Column({ type: 'varchar', length: 100 })
  createdAt!: string;
}
