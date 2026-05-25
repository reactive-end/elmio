import { authService } from './auth.service'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export interface IntegrationApiKeyItem {
  id: string
  bank: string
  integration: string
  environment: string | null
  name: string
  maskedValue: string
  isActive: boolean
  lastRotatedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SaveIntegrationApiKeyInput {
  bank: string
  environment?: string | null
  name: string
  value?: string
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
    throw new Error(error.message ?? 'Error al procesar la configuración de API keys.')
  }

  return response.json() as Promise<T>
}

/**
 * Servicio frontend para la administracion de API keys por banco e integracion.
 */
export const integrationApiKeysService = {
  /**
   * Obtiene las API keys registradas.
   */
  async list(): Promise<IntegrationApiKeyItem[]> {
    return apiFetch<IntegrationApiKeyItem[]>('/admin/integration-api-keys', {
      method: 'GET',
    })
  },

  /**
   * Crea una nueva API key cifrada.
   */
  async create(input: SaveIntegrationApiKeyInput & { value: string }): Promise<IntegrationApiKeyItem> {
    return apiFetch<IntegrationApiKeyItem>('/admin/integration-api-keys', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  /**
   * Actualiza una API key existente.
   */
  async update(id: string, input: SaveIntegrationApiKeyInput): Promise<IntegrationApiKeyItem> {
    return apiFetch<IntegrationApiKeyItem>(`/admin/integration-api-keys/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  },

  /**
   * Activa o desactiva una API key.
   */
  async toggleActive(id: string, isActive: boolean): Promise<IntegrationApiKeyItem> {
    return apiFetch<IntegrationApiKeyItem>(
      `/admin/integration-api-keys/${encodeURIComponent(id)}/toggle-active`,
      {
        method: 'POST',
        body: JSON.stringify({ isActive }),
      },
    )
  },

  /**
   * Revela el valor real de una API key.
   */
  async reveal(id: string, revealKey: string): Promise<{ value: string }> {
    return apiFetch<{ value: string }>(
      `/admin/integration-api-keys/${encodeURIComponent(id)}/reveal`,
      {
        method: 'POST',
        body: JSON.stringify({ revealKey }),
      },
    )
  },
}
