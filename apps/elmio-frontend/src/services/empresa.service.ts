const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

import { authService } from './auth.service'

// --- Domain types ---

interface DomiciliationData {
  bank: string
  accountType: 'checking' | 'savings'
  accountNumber: string
  holderName: string
  holderId: string
  debitAuthorized: boolean
  authorizationDate: string
}

export interface Enterprise {
  id: string
  userId: string
  companyName: string
  taxId: string
  onboardingCompleted: boolean
  domiciliation: DomiciliationData | null
  createdAt: string
}

export interface Collaborator {
  id: string
  enterpriseId: string
  userId: string
  name: string
  lastName: string
  documentId: string
  email: string
  phone: string
  baseSalary: number
  status: 'active' | 'suspended' | 'terminated'
  createdAt: string
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

export interface CollaboratorInput {
  name: string
  lastName: string
  documentId: string
  email: string
  phone: string
  baseSalary: number
}

// --- Helpers ---

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authService.getAuthHeaders(),
    ...(init?.headers as Record<string, string> | undefined),
  }

  return fetch(`${API_BASE}${path}`, { ...init, headers })
}

/**
 * Servicio del modulo empresarial.
 */
export const enterpriseService = {
  // --- Enterprise ---

  async getOrCreate(companyName: string, taxId: string): Promise<Enterprise> {
    const res = await authedFetch('/enterprises', {
      method: 'POST',
      body: JSON.stringify({ companyName, taxId }),
    })
    if (!res.ok) throw new Error('Error al obtener/crear empresa.')
    return (await res.json()) as Enterprise
  },

  async getMe(): Promise<Enterprise> {
    const res = await authedFetch('/enterprises/me')
    if (!res.ok) throw new Error('No se encontro empresa.')
    return (await res.json()) as Enterprise
  },

  async saveDomiciliation(
    enterpriseId: string,
    data: {
      bank: string
      accountType: 'checking' | 'savings'
      accountNumber: string
      holderName: string
      holderId: string
      debitAuthorized: boolean
    },
  ): Promise<Enterprise> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/domiciliation`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = (await res.json()) as { message?: string }
      throw new Error(error.message ?? 'Error al guardar domiciliacion.')
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

  async listCollaborators(enterpriseId: string): Promise<Collaborator[]> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/collaborators`)
    if (!res.ok) throw new Error('Error al listar colaboradores.')
    return (await res.json()) as Collaborator[]
  },

  async createCollaborator(enterpriseId: string, data: CollaboratorInput): Promise<Collaborator> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al crear colaborador.')
    return (await res.json()) as Collaborator
  },

  async bulkUploadCollaborators(
    enterpriseId: string,
    collaborators: CollaboratorInput[],
  ): Promise<Collaborator[]> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/collaborators/bulk`, {
      method: 'POST',
      body: JSON.stringify({ collaborators }),
    })
    if (!res.ok) throw new Error('Error en carga masiva.')
    return (await res.json()) as Collaborator[]
  },

  async updateCollaborator(
    enterpriseId: string,
    collaboratorId: string,
    data: Partial<CollaboratorInput & { status: 'active' | 'suspended' | 'terminated' }>,
  ): Promise<Collaborator> {
    const res = await authedFetch(`/enterprises/${enterpriseId}/collaborators/${collaboratorId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al actualizar colaborador.')
    return (await res.json()) as Collaborator
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
