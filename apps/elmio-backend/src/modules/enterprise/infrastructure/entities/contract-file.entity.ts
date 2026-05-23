import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('contract_files')
export class ContractFileEntity {
  @PrimaryColumn('uuid')
  id!: string;

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
