import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('platform_configs')
export class PlatformConfigEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id!: string;

  @Column({ type: 'float', default: 0 })
  serviceFeePercent!: number;
}
