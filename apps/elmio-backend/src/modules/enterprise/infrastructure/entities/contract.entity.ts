import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('contracts')
export class ContractEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  enterpriseId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  createdAt!: string;
}
