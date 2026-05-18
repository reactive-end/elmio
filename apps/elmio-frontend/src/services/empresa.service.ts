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

export interface BankAccount {
  accountNumber: string
  accountType: 'checking' | 'savings'
  bank: string
}

export interface SocialMediaLinks {
  instagram: string
  facebook: string
  twitter: string
  linkedin: string
  tiktok: string
  other: string
}

export interface CardInfo {
  bank: string
  cardNumber: string
  limit: number | null
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

  // Metadatos
  onboardingCompleted: boolean
  createdAt: string
}

// ── PersonProfile (CLIENT / EMPLOYEE) ────────────────────────────────────────

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

  // Grupo 7: Tarjetas
  creditCard: CardInfo | null
  debitCard: CardInfo | null

  // Grupo 8: Referencias
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
  creditCard?: CardInfo | null
  debitCard?: CardInfo | null
  personalReferences?: PersonalReference[]
}

export interface LoanRequest {
  id: string
  enterpriseId: string
  collaboratorId: string
  collaboratorName: string
  type: 'advance' | 'loan' | 'permission' | 'other'
  amount: number
  description: string
  status: 'pending' | 'approved' | 'denied'
  denialReason: string | null
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  enterpriseId: string
  concept: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  date: string
}

export interface LoanSummary {
  totalLoans: number
  totalLoanAmount: number
  serviceFeePercent: number
  serviceFeeAmount: number
  totalDebt: number
  totalPaid: number
  balance: number
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
    return (await res.json()) as Enterprise
  },

  async updateEnterprise(
    enterpriseId: string,
    data: UpdateEnterpriseInput,
  ): Promise<Enterprise> {
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
}
