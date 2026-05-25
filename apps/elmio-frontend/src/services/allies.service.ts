const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

import { authService } from './auth.service'

export interface Allied {
  id: string
  name: string
  slug: string | null
  countryCode: string
  phone: string
  email: string | null
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

export const alliesService = {
  async list(): Promise<Allied[]> {
    const res = await authedFetch('/allies')
    if (!res.ok) throw new Error('Error al listar aliados.')
    return (await res.json()) as Allied[]
  },

  async getById(id: string): Promise<Allied> {
    const res = await authedFetch(`/allies/${id}`)
    if (!res.ok) throw new Error('Aliado no encontrado.')
    return (await res.json()) as Allied
  },

  async create(data: {
    name: string
    slug: string
    countryCode: string
    phone: string
    email?: string
    password?: string
  }): Promise<Allied> {
    const res = await authedFetch('/allies', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(err.message ?? 'Error al crear aliado.')
    }
    return (await res.json()) as Allied
  },

  async update(
    id: string,
    data: {
      name: string
      slug: string
      countryCode: string
      phone: string
      email?: string
      password?: string
    },
  ): Promise<Allied> {
    const res = await authedFetch(`/allies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(err.message ?? 'Error al actualizar aliado.')
    }
    return (await res.json()) as Allied
  },

  async remove(id: string): Promise<void> {
    const res = await authedFetch(`/allies/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(err.message ?? 'Error al eliminar aliado.')
    }
  },
}
