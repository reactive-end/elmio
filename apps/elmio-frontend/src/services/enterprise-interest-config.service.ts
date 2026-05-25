import { authService } from './auth.service'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export interface EnterpriseInterestConfigItem {
  enterpriseId: string
  companyName: string
  taxId: string
  sector: string
  interestType: 'none' | 'percentage' | 'fixed'
  interestRate: number
  isActive: boolean
  updatedAt: string | null
}

export interface UpdateEnterpriseInterestConfigInput {
  interestType: 'none' | 'percentage' | 'fixed'
  interestRate: number
  isActive: boolean
}

type ErrorResponse = { message?: string }

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authService.getAuthHeaders(),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ErrorResponse
    throw new Error(error.message ?? 'Error al procesar la tasa por empresa.')
  }

  return response.json() as Promise<T>
}

/**
 * Servicio frontend para la tasa global por empresa.
 */
export const enterpriseInterestConfigService = {
  /**
   * Lista las empresas con su tasa global.
   */
  async list(): Promise<EnterpriseInterestConfigItem[]> {
    return apiFetch<EnterpriseInterestConfigItem[]>('/admin/enterprise-interest-configs', {
      method: 'GET',
    })
  },

  /**
   * Actualiza la tasa global de una empresa.
   */
  async update(
    enterpriseId: string,
    input: UpdateEnterpriseInterestConfigInput,
  ): Promise<EnterpriseInterestConfigItem> {
    return apiFetch<EnterpriseInterestConfigItem>(
      `/admin/enterprise-interest-configs/${encodeURIComponent(enterpriseId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      },
    )
  },
}
