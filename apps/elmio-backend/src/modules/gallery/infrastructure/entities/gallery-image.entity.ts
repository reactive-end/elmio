import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Entidad de base de datos para la persistencia relacional de imagenes de la galeria con TypeORM.
 */
@Entity('gallery_images')
export class GalleryImageEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  tenantDirectory!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ type: 'integer' })
  size!: number;

  @Column({ type: 'text' })
  storagePath!: string;

  @Column({ type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ type: 'varchar', length: 100 })
  createdAt!: string;
}
