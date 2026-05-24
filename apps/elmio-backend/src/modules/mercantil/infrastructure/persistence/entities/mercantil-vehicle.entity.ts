import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';

@Entity('mercantil_vehicles')
export class MercantilVehicleEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  shopcartId: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  clientId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  policyId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  vehicleTypeId: string | null;

  @Column({ type: 'varchar', length: 10 })
  year: string;

  @Column({ type: 'varchar', length: 100 })
  brandCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  brandName: string | null;

  @Column({ type: 'varchar', length: 100 })
  modelCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  modelName: string | null;

  @Column({ type: 'varchar', length: 100 })
  versionCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  versionName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  commonLocationId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  commonLocationName: string | null;

  @Column({ type: 'boolean', default: false, nullable: true })
  isArmored: boolean | null;

  @Index()
  @Column({ type: 'varchar', length: 10, nullable: true })
  plate: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  colorId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  colorName: string | null;

  @Column({ type: 'varchar', length: 17, nullable: true })
  chassisSerial: string | null;

  @Column({ type: 'varchar', length: 18, nullable: true })
  engineSerial: string | null;

  @Column({ type: 'simple-json', nullable: true })
  rawData: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
