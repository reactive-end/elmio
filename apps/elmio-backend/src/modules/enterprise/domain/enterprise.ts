/**
 * Datos de domiciliacion bancaria de la empresa.
 */
export interface DomiciliationData {
  bank: string;
  accountType: 'checking' | 'savings';
  accountNumber: string;
  holderName: string;
  holderId: string;
  debitAuthorized: boolean;
  authorizationDate: string;
}

/**
 * Entidad principal de empresa.
 */
export interface Enterprise {
  id: string;
  userId: string;
  companyName: string;
  taxId: string;
  onboardingCompleted: boolean;
  domiciliation: DomiciliationData | null;
  createdAt: string;
}

/**
 * Colaborador registrado por una empresa.
 */
export interface Collaborator {
  id: string;
  enterpriseId: string;
  userId: string;
  name: string;
  lastName: string;
  documentId: string;
  email: string;
  phone: string;
  baseSalary: number;
  status: 'active' | 'suspended' | 'terminated';
  createdAt: string;
}

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
  status: 'pending' | 'approved' | 'denied';
  denialReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transaccion registrada en el estado de cuenta de la empresa.
 */
export interface Transaction {
  id: string;
  enterpriseId: string;
  concept: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  date: string;
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
}

/**
 * Configuracion global del admin (comision de servicio).
 */
export interface PlatformConfig {
  serviceFeePercent: number;
}
