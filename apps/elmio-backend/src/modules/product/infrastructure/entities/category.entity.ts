import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Entidad relacional CategoryEntity para TypeORM.
 */
@Entity('categories')
export class CategoryEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'varchar', length: 100 })
  createdAt!: string;
}
