import type {
  SocialMediaLinks,
  Shareholder,
  BankAccount,
  AdditionalLegalRep,
} from '../../../domain/enterprise';
import type {
  CardInfo,
  PersonalReference,
} from '../../../domain/person-profile';

// ── Enterprise DTOs ──────────────────────────────────────────────────────────

/**
 * DTO para crear/registrar una empresa (paso 1 del onboarding).
 */
export class CreateEnterpriseDto {
  companyName!: string;
  sector!: string;
  employeeCount!: number;
  phone!: string;
  email!: string;
  taxId!: string;
}

/**
 * DTO para actualizar datos completos de empresa (pasos posteriores).
 */
export class UpdateEnterpriseDto {
  // Grupo 1: Datos generales opcionales
  companyName?: string;
  sector?: string;
  employeeCount?: number;
  phone?: string;
  email?: string;
  taxId?: string;

  // Datos complementarios opcionales
  website?: string;
  socialMedia?: SocialMediaLinks;
  headquartersLocation?: string;

  // Documentos legales
  taxIdPhoto?: string;
  constitutiveActPhoto?: string;
  lastAssemblyPhoto?: string;
  serviceReceiptPhoto?: string;
  bankStatementsPhotos?: string[];
  bankReferencePhotos?: string[];

  // Representante legal
  legalRepDocumentId?: string;
  legalRepDocumentPhoto?: string;

  // Encargado de cuenta
  accountManagerDocumentId?: string;
  accountManagerDocumentPhoto?: string;

  // Accionistas
  shareholderCount?: number;
  shareholders?: Shareholder[];

  // Cuentas bancarias (max 3)
  bankAccounts?: BankAccount[];

  // Representantes legales adicionales
  additionalLegalReps?: AdditionalLegalRep[];
}

// ── Collaborator / PersonProfile DTOs ────────────────────────────────────────

/**
 * DTO para crear un colaborador via el formulario individual.
 * Contiene los campos obligatorios del Excel.
 */
export class CreateCollaboratorDto {
  // Grupo 1: Identidad
  documentType!: string;
  documentId!: string;
  name!: string;
  lastName!: string;
  email!: string;
  phone!: string;

  // Grupo 2: Demograficos obligatorios
  birthDate!: string;
  gender!: string;
  civilStatus!: string;
  address!: string;
  countryOfOrigin!: string;
  familyDependents!: number;

  // Grupo 4: Empleo obligatorio
  startDate!: string;
  department!: string;
  position!: string;
  baseSalary!: number;
  maxLoanLimit!: number;
}

/**
 * DTO para carga masiva de colaboradores via Excel.
 */
export class BulkUploadCollaboratorsDto {
  collaborators!: CreateCollaboratorDto[];
}

/**
 * DTO para actualizar el perfil extendido (onboarding opcional).
 * Todos los campos son opcionales.
 */
export class UpdatePersonProfileDto {
  // Identidad opcional
  documentPhoto?: string;
  phone2?: string;
  phoneType?: string;
  photo?: string;

  // Demograficos opcionales
  age?: number;
  height?: string;
  weight?: string;
  diseases?: string;
  countryOfResidence?: string;

  // Estilo de vida
  hobbies?: string;
  favoriteFood?: string;
  hasLaptopOrPc?: boolean;
  operatingSystem?: string;
  vehicleCount?: number;
  hasDriverLicense?: boolean;

  // Empleo opcional
  employmentType?: string;
  employmentSector?: string;
  timeInCompanyMonths?: number;
  loanPurpose?: string;

  // Redes sociales
  socialMedia1?: string;
  socialMedia2?: string;
  socialMedia3?: string;

  // Financieros
  residenceType?: string;
  isResidenceOwned?: boolean;
  recurringIncome?: number;
  nationalBank1?: string;
  nationalBank2?: string;
  nationalBank3?: string;
  internationalBank?: string;

  // Tarjetas
  creditCard?: CardInfo | null;
  debitCard?: CardInfo | null;

  // Referencias
  personalReferences?: PersonalReference[];
}

// ── Loan Request DTOs ────────────────────────────────────────────────────────

/**
 * DTO para resolver una solicitud de prestamo.
 */
export class ResolveLoanRequestDto {
  status!: 'approved' | 'denied';
  denialReason?: string;
}

/**
 * DTO para registrar una transaccion en el estado de cuenta.
 */
export class CreateTransactionDto {
  kind?: 'payment' | 'charge';
  concept!: string;
  amount!: number;
  status?: 'paid' | 'pending' | 'failed';
}

/**
 * DTO para crear un contrato empresarial.
 */
export class CreateContractDto {
  name!: string;
}

/**
 * DTO para editar un contrato empresarial.
 */
export class UpdateContractDto {
  name?: string;
}
