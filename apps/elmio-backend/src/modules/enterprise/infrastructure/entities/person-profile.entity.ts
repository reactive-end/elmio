import { Entity, Column, PrimaryColumn } from 'typeorm';
import { CardInfo, PersonalReference } from '../../domain/person-profile';

const jsonTransformer = {
  to: <T>(value: T | null): string | null => (value ? JSON.stringify(value) : null),
  from: <T>(value: string | null): T | null => (value ? (JSON.parse(value) as T) : null),
};

const jsonArrayTransformer = {
  to: <T>(value: T[] | null): string | null => (value ? JSON.stringify(value) : null),
  from: <T>(value: string | null): T[] => (value ? (JSON.parse(value) as T[]) : []),
};

@Entity('person_profiles')
export class PersonProfileEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  // — Grupo 1: Identidad —
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  lastName!: string;

  @Column({ type: 'varchar', length: 50 })
  documentType!: string;

  @Column({ type: 'varchar', length: 100 })
  documentId!: string;

  @Column({ type: 'text' })
  documentPhoto!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 50 })
  phone!: string;

  @Column({ type: 'varchar', length: 50 })
  phone2!: string;

  @Column({ type: 'varchar', length: 50 })
  phoneType!: string;

  @Column({ type: 'text' })
  photo!: string;

  // — Grupo 2: Datos Demograficos —
  @Column({ type: 'varchar', length: 100 })
  birthDate!: string;

  @Column({ type: 'int', default: 0 })
  age!: number;

  @Column({ type: 'varchar', length: 50 })
  gender!: string;

  @Column({ type: 'varchar', length: 50 })
  civilStatus!: string;

  @Column({ type: 'varchar', length: 50 })
  height!: string;

  @Column({ type: 'varchar', length: 50 })
  weight!: string;

  @Column({ type: 'text' })
  diseases!: string;

  @Column({ type: 'int', default: 0 })
  familyDependents!: number;

  @Column({ type: 'varchar', length: 100 })
  countryOfOrigin!: string;

  @Column({ type: 'varchar', length: 100 })
  countryOfResidence!: string;

  @Column({ type: 'text' })
  address!: string;

  // — Grupo 3: Estilo de Vida / Preferencias —
  @Column({ type: 'text' })
  hobbies!: string;

  @Column({ type: 'varchar', length: 255 })
  favoriteFood!: string;

  @Column({ type: 'boolean', default: false })
  hasLaptopOrPc!: boolean;

  @Column({ type: 'varchar', length: 100 })
  operatingSystem!: string;

  @Column({ type: 'int', default: 0 })
  vehicleCount!: number;

  @Column({ type: 'boolean', default: false })
  hasDriverLicense!: boolean;

  // — Grupo 4: Empleo —
  @Column({ type: 'uuid', nullable: true })
  enterpriseId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  department!: string;

  @Column({ type: 'varchar', length: 255 })
  position!: string;

  @Column({ type: 'varchar', length: 100 })
  startDate!: string;

  @Column({ type: 'float', default: 0 })
  baseSalary!: number;

  @Column({ type: 'float', default: 0 })
  maxLoanLimit!: number;

  @Column({ type: 'varchar', length: 100 })
  employmentType!: string;

  @Column({ type: 'varchar', length: 100 })
  employmentSector!: string;

  @Column({ type: 'int', default: 0 })
  timeInCompanyMonths!: number;

  @Column({ type: 'text' })
  loanPurpose!: string;

  @Column({ type: 'varchar', length: 50 })
  status!: 'active' | 'suspended' | 'terminated';

  // — Grupo 5: Redes Sociales —
  @Column({ type: 'varchar', length: 255 })
  socialMedia1!: string;

  @Column({ type: 'varchar', length: 255 })
  socialMedia2!: string;

  @Column({ type: 'varchar', length: 255 })
  socialMedia3!: string;

  // — Grupo 6: Datos Financieros —
  @Column({ type: 'varchar', length: 100 })
  residenceType!: string;

  @Column({ type: 'boolean', default: false })
  isResidenceOwned!: boolean;

  @Column({ type: 'float', default: 0 })
  recurringIncome!: number;

  @Column({ type: 'varchar', length: 100 })
  nationalBank1!: string;

  @Column({ type: 'varchar', length: 100 })
  nationalBank2!: string;

  @Column({ type: 'varchar', length: 100 })
  nationalBank3!: string;

  @Column({ type: 'varchar', length: 100 })
  internationalBank!: string;

  // — Grupo 7: Tarjetas —
  @Column({
    type: 'text',
    nullable: true,
    transformer: jsonTransformer,
  })
  creditCard!: CardInfo | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: jsonTransformer,
  })
  debitCard!: CardInfo | null;

  // — Grupo 8: Referencias Personales —
  @Column({
    type: 'text',
    transformer: jsonArrayTransformer,
  })
  personalReferences!: PersonalReference[];

  // — Metadatos —
  @Column({ type: 'boolean', default: false })
  onboardingCompleted!: boolean;

  @Column({ type: 'varchar', length: 100 })
  createdAt!: string;
}
