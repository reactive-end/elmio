const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

import { authService } from './auth.service'

// ── Sub-entidades embebidas ──────────────────────────────────────────────────

export interface Shareholder {
  name: string
  lastName: string
  documentId: string
  documentPhoto: string
  phone: string
  email: string
}

export interface AdditionalLegalRep {
  name: string
  lastName: string
  documentId: string
  documentPhoto: string
  phone: string
  email: string
}

export interface BankAccount {
  accountNumber: string
  accountType: 'checking' | 'savings'
  bank: string
  phone?: string
}

export interface SocialMediaLinks {
  instagram: string
  facebook: string
  twitter: string
  linkedin: string
  tiktok: string
  other: string
}

export interface PersonalReference {
  name: string
  phone: string
  relationship: string
}

// ── Enterprise ───────────────────────────────────────────────────────────────

export interface Enterprise {
  id: string
  userId: string

  // Datos generales
  companyName: string
  sector: string
  employeeCount: number
  phone: string
  email: string
  taxId: string
  website: string
  socialMedia: SocialMediaLinks | null
  headquartersLocation: string

  // Documentos legales
  taxIdPhoto: string
  constitutiveActPhoto: string
  lastAssemblyPhoto: string
  serviceReceiptPhoto: string
  bankStatementsPhotos: string[]
  bankReferencePhotos: string[]

  // Representante legal
  legalRepDocumentId: string
  legalRepDocumentPhoto: string

  // Encargado de cuenta
  accountManagerDocumentId: string
  accountManagerDocumentPhoto: string

  // Accionistas
  shareholderCount: number
  shareholders: Shareholder[]

  // Cuentas bancarias
  bankAccounts: BankAccount[]

  // Representantes legales adicionales
  additionalLegalReps: AdditionalLegalRep[]

  // Metadatos
  onboardingCompleted: boolean
  createdAt: string
}

export interface FinancePurchaseResponse {
  transactionId: string
  collaborator: {
    name: string
    documentId: string
    email: string
  }
  enterprise: {
    name: string
  }
  concept: string
  amount: number
  date: string
  type: 'insurance' | 'product'
  totalQuotes: number
  paidQuotes: number
  pendingQuotes: number
  pendingAmount: number
}

export interface PersonProfile {
  id: string
  userId: string

  // Grupo 1: Identidad
  name: string
  lastName: string
  documentType: string
  documentId: string
  documentPhoto: string
  email: string
  phone: string
  phone2: string
  phoneType: string
  photo: string

  // Grupo 2: Demograficos
  birthDate: string
  age: number
  gender: string
  civilStatus: string
  height: string
  weight: string
  diseases: string
  familyDependents: number
  countryOfOrigin: string
  countryOfResidence: string
  address: string

  // Grupo 3: Estilo de vida
  hobbies: string
  favoriteFood: string
  hasLaptopOrPc: boolean
  operatingSystem: string
  vehicleCount: number
  hasDriverLicense: boolean

  // Grupo 4: Empleo
  enterpriseId: string | null
  department: string
  position: string
  startDate: string
  baseSalary: number
  maxLoanLimit: number
  employmentType: string
  employmentSector: string
  timeInCompanyMonths: number
  loanPurpose: string
  status: 'active' | 'suspended' | 'terminated'

  // Grupo 5: Redes sociales
  socialMedia1: string
  socialMedia2: string
  socialMedia3: string

  // Grupo 6: Financieros
  residenceType: string
  isResidenceOwned: boolean
  recurringIncome: number
  nationalBank1: string
  nationalBank2: string
  nationalBank3: string
  internationalBank: string

  personalReferences: PersonalReference[]

  // Metadatos
  onboardingCompleted: boolean
  createdAt: string
}

// ── Input types ──────────────────────────────────────────────────────────────

export interface CreateEnterpriseInput {
  companyName: string
  sector: string
  employeeCount: number
  phone: string
  email: string
  taxId: string
}

export interface UpdateEnterpriseInput {
  companyName?: string
  sector?: string
  employeeCount?: number
  phone?: string
  email?: string
  taxId?: string
  website?: string
  socialMedia?: SocialMediaLinks
  headquartersLocation?: string
  taxIdPhoto?: string
  constitutiveActPhoto?: string
  lastAssemblyPhoto?: string
  serviceReceiptPhoto?: string
  bankStatementsPhotos?: string[]
  bankReferencePhotos?: string[]
  legalRepDocumentId?: string
  legalRepDocumentPhoto?: string
  accountManagerDocumentId?: string
  accountManagerDocumentPhoto?: string
  shareholderCount?: number
  shareholders?: Shareholder[]
  bankAccounts?: BankAccount[]
  additionalLegalReps?: AdditionalLegalRep[]
}

/**
 * Datos obligatorios del Excel para crear un colaborador.
 */
export interface CollaboratorInput {
  documentType: string
  documentId: string
  name: string
  lastName: string
  email: string
  phone: string
  birthDate: string
  gender: string
  civilStatus: string
  address: string
  countryOfOrigin: string
  familyDependents: number
  startDate: string
  department: string
  position: string
  baseSalary: number
  maxLoanLimit: number
}

/**
 * Datos opcionales del onboarding de persona natural/colaborador.
 */
export interface UpdatePersonProfileInput {
  name?: string
  lastName?: string
  documentType?: string
  documentId?: string
  email?: string
  phone?: string
  birthDate?: string
  gender?: string
  civilStatus?: string
  address?: string
  countryOfOrigin?: string
  familyDependents?: number
  documentPhoto?: string
  phone2?: string
  phoneType?: string
  photo?: string
  age?: number
  height?: string
  weight?: string
  diseases?: string
  countryOfResidence?: string
  hobbies?: string
  favoriteFood?: string
  hasLaptopOrPc?: boolean
  operatingSystem?: string
  vehicleCount?: number
  hasDriverLicense?: boolean
  employmentType?: string
  employmentSector?: string
  timeInCompanyMonths?: number
  loanPurpose?: string
  socialMedia1?: string
  socialMedia2?: string
  socialMedia3?: string
  residenceType?: string
  isResidenceOwned?: boolean
  recurringIncome?: number
  nationalBank1?: string
  nationalBank2?: string
  nationalBank3?: string
  internationalBank?: string
  personalReferences?: PersonalReference[]
}

export interface PersonBankAccount {
  id: string
  personProfileId: string
  bankCode: string
  bankName: string
  accountNumber: string
  phoneNumber: string
  documentId: string
  documentPhoto: string | null
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePersonBankAccountInput {
  bankCode: string
  bankName: string
  accountNumber: string
  phoneNumber: string
  documentId: string
  documentPhoto?: string | null
  isPrimary?: boolean
}

export interface LoanRequest {
  id: string
  enterpriseId: string
  collaboratorId: string
  collaboratorName: string
  type: 'advance' | 'loan' | 'permission' | 'other'
  amount: number
  description: string
  status: 'pending' | 'company_approved' | 'approved' | 'acquired' | 'denied'
  denialReason: string | null
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  enterpriseId: string
  collaboratorId?: string | null
  kind: 'payment' | 'charge'
  concept: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  date: string
}

export interface CreateTransactionInput {
  collaboratorId?: string | null
  kind?: 'payment' | 'charge'
  concept: string
  amount: number
  status?: 'paid' | 'pending' | 'failed'
  date?: string
}

export interface LoanSummary {
  totalLoans: number
  totalLoanAmount: number
  serviceFeePercent: number
  serviceFeeAmount: number
  totalDebt: number
  totalPaid: number
  balance: number
  interestType?: 'none' | 'percentage' | 'fixed'
  interestRate?: number
  interestIsActive?: boolean
}

export interface ContractFile {
  id: string
  contractId: string
  fileName: string
  originalName: string
  mimeType: string
  createdAt: string
}

export interface Contract {
  id: string
  enterpriseId: string
  name: string
  createdAt: string
  files: ContractFile[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authService.getAuthHeaders(),
    ...(init?.headers as Record<string, string> | undefined),
  }

  return fetch(`${API_BASE}${path}`, { ...init, headers })
}

// ── Service ──────────────────────────────────────────────────────────────────

/**
 * Servicio del modulo empresarial.
 */
export const enterpriseService = {
  // --- Enterprise ---

  async create(data: CreateEnterpriseInput): Promise<Enterprise> {
    const res = await authedFetch('/enterprises', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al crear empresa.')
    return (await res.json()) as Enterprise
  },

  async getMe(): Promise<Enterprise> {
    const res = await authedFetch('/enterprises/me')
    if (!res.ok) throw new Error('No se encontro empresa.')
    const text = await res.text()
    if (!text || text.trim() === '' || text.trim() === 'null') {
      throw new Error('No se encontró ninguna configuración de empresa asociada a tu cuenta.')
    }
    return JSON.parse(text) as Enterprise
  },

  async updateEnterprise(enterpriseId: string, data: UpdateEnterpriseInput): Promise<Enterprise> {
    const res = await authedFetch(`/enterprises/${enterpriseId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = (await res.json()) as { message?: string }
      throw new Error(error.message ?? 'Error al actualizar empresa.')
    }
    return (await res.json()) as Enterprise
  },

  async completeOnboarding(enterpriseId: string): Promise<Enterprise> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/complete-onboarding`, {
      method: 'PATCH',
    })
    if (!res.ok) throw new Error('Error al completar onboarding.')
    return (await res.json()) as Enterprise
  },

  // --- Collaborators ---

  async listCollaborators(enterpriseId: string): Promise<PersonProfile[]> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/collaborators`)
    if (!res.ok) throw new Error('Error al listar colaboradores.')
    return (await res.json()) as PersonProfile[]
  },

  async createCollaborator(enterpriseId: string, data: CollaboratorInput): Promise<PersonProfile> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al crear colaborador.')
    return (await res.json()) as PersonProfile
  },

  async bulkUploadCollaborators(
    enterpriseId: string,
    collaborators: CollaboratorInput[],
  ): Promise<PersonProfile[]> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/collaborators/bulk`, {
      method: 'POST',
      body: JSON.stringify({ collaborators }),
    })
    if (!res.ok) throw new Error('Error en carga masiva.')
    return (await res.json()) as PersonProfile[]
  },

  async updateCollaborator(
    enterpriseId: string,
    collaboratorId: string,
    data: Partial<CollaboratorInput & { status: 'active' | 'suspended' | 'terminated' }>,
  ): Promise<PersonProfile> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/collaborators/${collaboratorId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al actualizar colaborador.')
    return (await res.json()) as PersonProfile
  },

  // --- Person Profile (onboarding opcional) ---

  async getMyProfile(): Promise<PersonProfile> {
    const res = await authedFetch('/profile/me')
    if (!res.ok) throw new Error('Error al obtener perfil.')
    return (await res.json()) as PersonProfile
  },

  async updateMyProfile(data: UpdatePersonProfileInput): Promise<PersonProfile> {
    const res = await authedFetch('/profile/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al actualizar perfil.')
    return (await res.json()) as PersonProfile
  },

  async completeProfileOnboarding(): Promise<PersonProfile> {
    const res = await authedFetch('/profile/me/complete-onboarding', {
      method: 'PATCH',
    })
    if (!res.ok) throw new Error('Error al completar onboarding.')
    return (await res.json()) as PersonProfile
  },

  // --- Person Bank Accounts ---

  async listMyBankAccounts(): Promise<PersonBankAccount[]> {
    const res = await authedFetch('/profile/me/bank-accounts')
    if (!res.ok) throw new Error('Error al listar cuentas bancarias.')
    return (await res.json()) as PersonBankAccount[]
  },

  async createMyBankAccount(data: CreatePersonBankAccountInput): Promise<PersonBankAccount> {
    const res = await authedFetch('/profile/me/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al crear cuenta bancaria.')
    return (await res.json()) as PersonBankAccount
  },

  async updateMyBankAccount(accountId: string, data: Partial<CreatePersonBankAccountInput>): Promise<PersonBankAccount> {
    const res = await authedFetch(`/profile/me/bank-accounts/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al actualizar cuenta bancaria.')
    return (await res.json()) as PersonBankAccount
  },

  async deleteMyBankAccount(accountId: string): Promise<void> {
    const res = await authedFetch(`/profile/me/bank-accounts/${accountId}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Error al eliminar cuenta bancaria.')
  },

  // --- Loan Requests ---

  async listRequests(
    enterpriseId: string,
    status?: 'pending' | 'approved' | 'denied',
  ): Promise<LoanRequest[]> {
    const query = status ? `?status=${status}` : ''
    const res = await authedFetch(`/enterprises/${enterpriseId}/requests${query}`)
    if (!res.ok) throw new Error('Error al listar solicitudes.')
    return (await res.json()) as LoanRequest[]
  },

  async resolveRequest(
    enterpriseId: string,
    requestId: string,
    status: 'approved' | 'denied',
    denialReason?: string,
  ): Promise<LoanRequest> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, denialReason }),
    })
    if (!res.ok) throw new Error('Error al resolver solicitud.')
    return (await res.json()) as LoanRequest
  },

  async listMyRequests(status?: 'pending' | 'approved' | 'acquired' | 'denied'): Promise<LoanRequest[]> {
    const query = status ? `?status=${status}` : ''
    const res = await authedFetch(`/profile/me/requests${query}`)
    if (!res.ok) throw new Error('Error al listar tus solicitudes.')
    return (await res.json()) as LoanRequest[]
  },

  async acquireRequest(requestId: string, productId: string): Promise<LoanRequest> {
    const res = await authedFetch(`/profile/me/requests/${requestId}/acquire`, {
      method: 'PATCH',
      body: JSON.stringify({ productId }),
    })
    if (!res.ok) throw new Error('Error al registrar la adquisición de la solicitud.')
    return (await res.json()) as LoanRequest
  },

  // --- Account Statement ---

  async getLoanSummary(enterpriseId: string): Promise<LoanSummary> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/account-statement`)
    if (!res.ok) throw new Error('Error al obtener estado de cuenta.')
    return (await res.json()) as LoanSummary
  },

  async listTransactions(enterpriseId: string): Promise<Transaction[]> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/transactions`)
    if (!res.ok) throw new Error('Error al listar transacciones.')
    return (await res.json()) as Transaction[]
  },

  async getMyLoanSummary(): Promise<LoanSummary> {
    const res = await authedFetch('/profile/me/account-statement')
    if (!res.ok) throw new Error('Error al obtener tu estado de cuenta.')
    return (await res.json()) as LoanSummary
  },

  async listMyTransactions(): Promise<Transaction[]> {
    const res = await authedFetch('/profile/me/transactions')
    if (!res.ok) throw new Error('Error al listar tus movimientos.')
    return (await res.json()) as Transaction[]
  },

  async listAllPurchases(): Promise<FinancePurchaseResponse[]> {
    const res = await authedFetch('/enterprises/finance/purchases')
    if (!res.ok) throw new Error('Error al listar las compras del sistema.')
    return (await res.json()) as FinancePurchaseResponse[]
  },


  async createTransaction(
    enterpriseId: string,
    data: CreateTransactionInput,
  ): Promise<Transaction> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(error.message ?? 'Error al registrar movimiento.')
    }

    return (await res.json()) as Transaction
  },

  async createMyTransaction(data: CreateTransactionInput): Promise<Transaction> {
    const res = await authedFetch('/profile/me/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(error.message ?? 'Error al registrar tu movimiento.')
    }

    return (await res.json()) as Transaction
  },

  async listContracts(enterpriseId: string): Promise<Contract[]> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/contracts`)
    if (!res.ok) throw new Error('Error al listar contratos.')
    return (await res.json()) as Contract[]
  },

  async createContract(enterpriseId: string, name: string, files: File[]): Promise<Contract> {
    const formData = new FormData()
    formData.append('name', name)
    for (const file of files) {
      formData.append('files', file)
    }

    const res = await fetch(`${API_BASE}/enterprises/${enterpriseId}/contracts`, {
      method: 'POST',
      body: formData,
      headers: {
        ...authService.getAuthHeaders(),
      },
    })

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(err.message ?? 'Error al crear contrato.')
    }

    return (await res.json()) as Contract
  },

  async updateContract(
    enterpriseId: string,
    contractId: string,
    data: { name?: string; files?: File[] },
  ): Promise<Contract> {
    const formData = new FormData()
    if (typeof data.name === 'string') {
      formData.append('name', data.name)
    }
    for (const file of data.files ?? []) {
      formData.append('files', file)
    }

    const res = await fetch(`${API_BASE}/enterprises/${enterpriseId}/contracts/${contractId}`, {
      method: 'PATCH',
      body: formData,
      headers: {
        ...authService.getAuthHeaders(),
      },
    })

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(err.message ?? 'Error al actualizar contrato.')
    }

    return (await res.json()) as Contract
  },

  async removeContract(enterpriseId: string, contractId: string): Promise<void> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/contracts/${contractId}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Error al eliminar contrato.')
  },

  async removeContractFile(
    enterpriseId: string,
    contractId: string,
    fileId: string,
  ): Promise<void> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/contracts/${contractId}/files/${fileId}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Error al eliminar archivo del contrato.')
  },

  getContractDownloadUrl(taxId: string, fileName: string): string {
    return `${API_BASE}/enterprises/contracts/file/${encodeURIComponent(taxId)}/${encodeURIComponent(fileName)}`
  },

  async uploadDocument(
    enterpriseId: string,
    file: File,
  ): Promise<{ url: string; fileName: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${API_BASE}/enterprises/${enterpriseId}/documentos`, {
      method: 'POST',
      body: formData,
      headers: {
        ...authService.getAuthHeaders(),
      },
    })

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(err.message ?? 'Error al subir el documento.')
    }

    return (await res.json()) as { url: string; fileName: string }
  },

  async listFinancePendingRequests(): Promise<LoanRequest[]> {
    const res = await authedFetch('/enterprises/requests/finance-pending')
    if (!res.ok) throw new Error('No se pudieron obtener las solicitudes para finanzas.')
    return (await res.json()) as LoanRequest[]
  },

  async resolveFinanceRequest(
    requestId: string,
    status: 'approved' | 'denied',
    denialReason?: string | null,
  ): Promise<LoanRequest> {
    const res = await authedFetch(`/enterprises/requests/${requestId}/finance-resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ status, denialReason }),
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(err.message ?? 'Error al resolver la solicitud de finanzas.')
    }
    return (await res.json()) as LoanRequest
  },

  async disburseRequest(requestId: string): Promise<any> {
    const res = await authedFetch(`/enterprises/requests/${requestId}/disburse`, {
      method: 'POST',
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(err.message ?? 'Error al ejecutar el desembolso.')
    }
    return (await res.json())
  },
}
