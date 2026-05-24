/**
 * Entidad de persistencia para clientes de Mercantil
 * @module mercantil/infrastructure/persistence/entities
 */

import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';

@Entity('mercantil_clients')
export class MercantilClientEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  shopcartId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  clientId: string | null;

  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  dniType: string;

  @Column({ type: 'varchar', length: 50 })
  dniNumber: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  dniVenNationality: string | null;

  @Column({ type: 'varchar', length: 20 })
  birthDate: string;

  @Column({ type: 'varchar', length: 10 })
  genderId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  countryOfBirthId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  civilStateId: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneCountryId: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  phoneAreaCode: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  addressCountryId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  addressAdministrativeAreaId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  addressSubadministrativeAreaId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  addressLocalityId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  addressZoneId: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  addressPostalCode: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  addressLine: string | null;

  @Column({ type: 'simple-json', nullable: true })
  rawData: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
