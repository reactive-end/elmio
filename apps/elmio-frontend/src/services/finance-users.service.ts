const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

import { authService } from './auth.service'

export interface FinanceUser {
  id: string
  name: string
  slug: string | null // this holds the cedula
  countryCode: string
  phone: string
  email: string
  role: string
  owner: string
  createdAt: string
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authService.getAuthHeaders(),
    ...(init?.headers as Record<string, string> | undefined),
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers })
}

export const financeUsersService = {
  async list(): Promise<FinanceUser[]> {
    const res = await authedFetch('/finance-users')
    if (!res.ok) throw new Error('Error al listar usuarios de finanzas.')
    return (await res.json()) as FinanceUser[]
  },

  async getById(id: string): Promise<FinanceUser> {
    const res = await authedFetch(`/finance-users/${id}`)
    if (!res.ok) throw new Error('Usuario de finanzas no encontrado.')
    return (await res.json()) as FinanceUser
  },

  async create(data: {
    name: string
    cedula: string
    countryCode: string
    phone: string
    email: string
  }): Promise<FinanceUser> {
    const res = await authedFetch('/finance-users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(err.message ?? 'Error al crear usuario de finanzas.')
    }
    return (await res.json()) as FinanceUser
  },

  async update(
    id: string,
    data: {
      name: string
      cedula: string
      countryCode: string
      phone: string
      email: string
    },
  ): Promise<FinanceUser> {
    const res = await authedFetch(`/finance-users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(err.message ?? 'Error al actualizar usuario de finanzas.')
    }
    return (await res.json()) as FinanceUser
  },

  async remove(id: string): Promise<void> {
    const res = await authedFetch(`/finance-users/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(err.message ?? 'Error al eliminar usuario de finanzas.')
    }
  },
}
