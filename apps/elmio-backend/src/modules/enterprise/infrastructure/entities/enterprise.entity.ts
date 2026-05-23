import { Entity, Column, PrimaryColumn } from 'typeorm';
import { Shareholder, BankAccount, SocialMediaLinks } from '../../domain/enterprise';

const jsonTransformer = {
  to: <T>(value: T | null): string | null => (value ? JSON.stringify(value) : null),
  from: <T>(value: string | null): T | null => (value ? (JSON.parse(value) as T) : null),
};

const jsonArrayTransformer = {
  to: <T>(value: T[] | null): string | null => (value ? JSON.stringify(value) : null),
  from: <T>(value: string | null): T[] => (value ? (JSON.parse(value) as T[]) : []),
};

@Entity('enterprises')
export class EnterpriseEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  // — Grupo 1: Datos Generales —
  @Column({ type: 'varchar', length: 255 })
  companyName!: string;

  @Column({ type: 'varchar', length: 100 })
  sector!: string;

  @Column({ type: 'int', default: 0 })
  employeeCount!: number;

  @Column({ type: 'varchar', length: 50 })
  phone!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 100 })
  taxId!: string;

  @Column({ type: 'varchar', length: 255 })
  website!: string;

  @Column({
    type: 'text',
    nullable: true,
    transformer: jsonTransformer,
  })
  socialMedia!: SocialMediaLinks | null;

  @Column({ type: 'text' })
  headquartersLocation!: string;

  // — Grupo 2: Documentos Legales (URLs de archivos subidos) —
  @Column({ type: 'text' })
  taxIdPhoto!: string;

  @Column({ type: 'text' })
  constitutiveActPhoto!: string;

  @Column({ type: 'text' })
  lastAssemblyPhoto!: string;

  @Column({ type: 'text' })
  serviceReceiptPhoto!: string;

  @Column({
    type: 'text',
    transformer: jsonArrayTransformer,
  })
  bankStatementsPhotos!: string[];

  @Column({
    type: 'text',
    transformer: jsonArrayTransformer,
  })
  bankReferencePhotos!: string[];

  // — Grupo 3: Representante Legal —
  @Column({ type: 'varchar', length: 100 })
  legalRepDocumentId!: string;

  @Column({ type: 'text' })
  legalRepDocumentPhoto!: string;

  // — Grupo 4: Encargado de la Cuenta —
  @Column({ type: 'varchar', length: 100 })
  accountManagerDocumentId!: string;

  @Column({ type: 'text' })
  accountManagerDocumentPhoto!: string;

  // — Grupo 5: Accionistas —
  @Column({ type: 'int', default: 0 })
  shareholderCount!: number;

  @Column({
    type: 'text',
    transformer: jsonArrayTransformer,
  })
  shareholders!: Shareholder[];

  // — Grupo 6: Cuentas Bancarias (max 3) —
  @Column({
    type: 'text',
    transformer: jsonArrayTransformer,
  })
  bankAccounts!: BankAccount[];

  // — Metadatos —
  @Column({ type: 'boolean', default: false })
  onboardingCompleted!: boolean;

  @Column({ type: 'varchar', length: 100 })
  createdAt!: string;
}
