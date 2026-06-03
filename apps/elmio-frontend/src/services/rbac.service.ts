import { authedFetch } from '@/utils/auth'

export interface RbacPermissionGroup {
  [groupKey: string]: boolean
}

export interface RbacPermissions {
  [role: string]: RbacPermissionGroup
}

export interface RbacUser {
  id: string
  name: string
  email: string
  role: string
  slug: string | null
  phone: string
  countryCode: string
  owner: string
  isActive: boolean
  requirePasswordChange: boolean
  createdAt: string
}

export interface RbacUserListResponse {
  items: RbacUser[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface RbacUserInput {
  name: string
  email: string
  role: string
  password?: string
  slug?: string
  phone?: string
  countryCode?: string
}

export const rbacService = {
  async getPermissions(): Promise<RbacPermissions> {
    const res = await authedFetch('/rbac/permissions')
    if (!res.ok) throw new Error('Error al obtener permisos RBAC.')
    return (await res.json()) as RbacPermissions
  },

  async savePermissions(
    role: string,
    permissions: Array<{ groupKey: string; visible: boolean }>,
  ): Promise<void> {
    const res = await authedFetch('/rbac/permissions', {
      method: 'PUT',
      body: JSON.stringify({ role, permissions }),
    })
    if (!res.ok) throw new Error('Error al guardar permisos RBAC.')
  },

  async listUsers(params: {
    role: string
    page: number
    perPage: number
    search?: string
    includeInactive?: boolean
  }): Promise<RbacUserListResponse> {
    const query = new URLSearchParams({
      role: params.role,
      page: String(params.page),
      perPage: String(params.perPage),
    })
    if (params.search) query.set('search', params.search)
    if (params.includeInactive) query.set('includeInactive', 'true')

    const res = await authedFetch(`/rbac/users?${query.toString()}`)
    if (!res.ok) throw new Error('Error al listar usuarios.')
    return (await res.json()) as RbacUserListResponse
  },

  async getUser(id: string): Promise<RbacUser> {
    const res = await authedFetch(`/rbac/users/${id}`)
    if (!res.ok) throw new Error('Usuario no encontrado.')
    return (await res.json()) as RbacUser
  },

  async createUser(data: RbacUserInput): Promise<RbacUser> {
    const res = await authedFetch('/rbac/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(err.message ?? 'Error al crear usuario.')
    }
    return (await res.json()) as RbacUser
  },

  async updateUser(id: string, data: Partial<RbacUserInput>): Promise<RbacUser> {
    const res = await authedFetch(`/rbac/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al actualizar usuario.')
    return (await res.json()) as RbacUser
  },

  async deleteUser(id: string): Promise<void> {
    const res = await authedFetch(`/rbac/users/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error al eliminar usuario.')
  },
}
