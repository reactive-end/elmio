// ─────────────────────────────────────────────────────────────────────────────
// Enterprise Domain — Entidades segmentadas por grupo logico de datos.
// ─────────────────────────────────────────────────────────────────────────────

// ── Sub-entidades embebidas ──────────────────────────────────────────────────

/**
 * Accionista de la empresa.
 */
export interface Shareholder {
  name: string;
  lastName: string;
  documentId: string;
  documentPhoto: string;
  phone: string;
  email: string;
}

/**
 * Representante legal adicional de la empresa.
 */
export interface AdditionalLegalRep {
  name: string;
  lastName: string;
  documentId: string;
  documentPhoto: string;
  phone: string;
  email: string;
}

/**
 * Cuenta bancaria registrada por la empresa (max 3).
 */
export interface BankAccount {
  accountNumber: string;
  accountType: 'checking' | 'savings';
  bank: string;
}

/**
 * Links de redes sociales de la empresa.
 */
export interface SocialMediaLinks {
  instagram: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  tiktok: string;
  other: string;
}

// ── Entidad principal: Enterprise ────────────────────────────────────────────

/**
 * Entidad principal de empresa.
 * Segmentada en:
 *  - Datos Generales
 *  - Documentos Legales
 *  - Representante Legal
 *  - Encargado de Cuenta
 *  - Accionistas
 *  - Cuentas Bancarias
 */
export interface Enterprise {
  id: string;
  userId: string;

  // — Grupo 1: Datos Generales —
  companyName: string;
  sector: string;
  employeeCount: number;
  phone: string;
  email: string;
  taxId: string;
  website: string;
  socialMedia: SocialMediaLinks | null;
  headquartersLocation: string;

  // — Grupo 2: Documentos Legales (URLs de archivos subidos) —
  taxIdPhoto: string;
  constitutiveActPhoto: string;
  lastAssemblyPhoto: string;
  serviceReceiptPhoto: string;
  bankStatementsPhotos: string[];
  bankReferencePhotos: string[];

  // — Grupo 3: Representante Legal —
  legalRepDocumentId: string;
  legalRepDocumentPhoto: string;

  // — Grupo 4: Encargado de la Cuenta —
  accountManagerDocumentId: string;
  accountManagerDocumentPhoto: string;

  // — Grupo 5: Accionistas —
  shareholderCount: number;
  shareholders: Shareholder[];

  // — Grupo 6: Cuentas Bancarias (max 3) —
  bankAccounts: BankAccount[];

  // — Representantes Legales Adicionales —
  additionalLegalReps: AdditionalLegalRep[];

  // — Metadatos —
  onboardingCompleted: boolean;
  createdAt: string;
}

// ── Solicitud de prestamo ────────────────────────────────────────────────────

/**
 * Solicitud de prestamo de un colaborador/cliente.
 */
export interface LoanRequest {
  id: string;
  enterpriseId: string;
  collaboratorId: string;
  collaboratorName: string;
  type: 'advance' | 'loan' | 'permission' | 'other';
  amount: number;
  description: string;
  status: 'pending' | 'company_approved' | 'approved' | 'denied';
  denialReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Transaccion y Estado de cuenta ───────────────────────────────────────────

/**
 * Transaccion registrada en el estado de cuenta de la empresa.
 */
export interface Transaction {
  id: string;
  enterpriseId: string;
  collaboratorId: string | null;
  kind: 'payment' | 'charge';
  concept: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  date: string;
}

/**
 * Contrato asociado a una empresa.
 */
export interface Contract {
  id: string;
  enterpriseId: string;
  name: string;
  createdAt: string;
}

/**
 * Archivo perteneciente a un contrato.
 */
export interface ContractFile {
  id: string;
  contractId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  createdAt: string;
}

/**
 * Contrato enriquecido con sus archivos.
 */
export interface ContractWithFiles extends Contract {
  files: ContractFile[];
}

/**
 * Resumen de prestamos activos de la empresa.
 */
export interface LoanSummary {
  totalLoans: number;
  totalLoanAmount: number;
  serviceFeePercent: number;
  serviceFeeAmount: number;
  totalDebt: number;
  totalPaid: number;
  balance: number;
  interestType?: 'none' | 'percentage' | 'fixed';
  interestRate?: number;
  interestIsActive?: boolean;
}

// ── Configuracion global ─────────────────────────────────────────────────────

/**
 * Configuracion global del admin (comision de servicio).
 */
export interface PlatformConfig {
  serviceFeePercent: number;
}
