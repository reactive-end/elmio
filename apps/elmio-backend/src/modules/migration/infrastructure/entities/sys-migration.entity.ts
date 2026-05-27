import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sys_migrations')
export class SysMigrationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  migration!: string;

  @Column({ type: 'int' })
  batch!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  executedAt!: Date;
}
