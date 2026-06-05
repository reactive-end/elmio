import { Entity, Column, PrimaryColumn } from 'typeorm';
import { MarketplaceSection } from '../../domain/marketplace';

const jsonTransformer = {
  to: <T>(value: T | null): string | null =>
    value ? JSON.stringify(value) : null,
  from: <T>(value: string | null): T | null =>
    value ? (JSON.parse(value) as T) : null,
};

const jsonArrayTransformer = {
  to: <T>(value: T[] | null): string | null =>
    value ? JSON.stringify(value) : null,
  from: <T>(value: string | null): T[] =>
    value ? (JSON.parse(value) as T[]) : [],
};

@Entity('marketplaces')
export class MarketplaceEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'varchar', length: 255 })
  owner!: string;

  @Column({ type: 'text', nullable: true })
  logo!: string;

  @Column({
    type: 'text',
    transformer: jsonTransformer,
  })
  theme!: {
    primaryColor: string;
    secondaryColor: string;
    font: string;
  };

  @Column({
    type: 'text',
    nullable: true,
    transformer: jsonTransformer,
  })
  whatsapp?: {
    activo: boolean;
    telefono: string;
    mensaje: string;
    textoTooltip: string;
    colorFlotante?: string;
    posicion?: 'izquierda' | 'derecha';
    delayMostrar?: number;
  } | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: jsonTransformer,
  })
  carrito?: {
    activo: boolean;
    textoBoton?: string;
    colorBadge?: string;
    permitirInvitados?: boolean;
  } | null;

  @Column({
    type: 'text',
    transformer: jsonArrayTransformer,
  })
  sections!: MarketplaceSection[];
}
