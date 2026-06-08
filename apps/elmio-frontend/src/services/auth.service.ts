const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

type UserRole = 'ADMIN' | 'COMPANY' | 'EMPLOYEE' | 'CLIENT' | 'ALLIED' | 'FINANCE'

export interface AuthToken {
  token: string
  user: {
    userId: string
    email: string
    role: UserRole
    owner: string
    requirePasswordChange?: boolean
  }
}

export interface MultipleProfilesResponse {
  multipleProfiles?: true
  profiles: Array<{
    userId: string
    name: string
    role: UserRole
  }>
}

export type LoginResult = AuthToken | MultipleProfilesResponse

const TOKEN_KEY = 'elmio-auth-token'

/**
 * Servicio de autenticacion del frontend.
 * Gestiona login, registro y almacenamiento del token en localStorage.
 */
export const authService = {
  /**
   * Resuelve los perfiles disponibles para un correo o telefono.
   * POST /api/auth/discover-profiles
   * @param identifier Correo o telefono.
   */
  async discoverProfiles(identifier: string): Promise<MultipleProfilesResponse> {
    const response = await fetch(`${API_BASE}/auth/discover-profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    })

    const data = (await response.json().catch(() => ({}))) as MultipleProfilesResponse & {
      message?: string
    }

    if (!response.ok) {
      throw new Error(data.message ?? 'No se encontraron perfiles asociados.')
    }

    return data
  },

  /**
   * Inicia sesion con email y password.
   * POST /api/auth/login
   * @param email Email del usuario.
   * @param password Password del usuario.
   * @param userId ID del usuario opcional para desempate de perfiles.
   * @returns Token de sesion y datos del usuario.
   */
  async login(email: string, password: string, userId?: string): Promise<LoginResult> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, userId }),
    })

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as { message?: string }
      throw new Error(error.message ?? 'Credenciales invalidas.')
    }

    const data = (await response.json()) as LoginResult
    if ('token' in data && data.token) {
      this.setToken(data as AuthToken)
    }

    return data
  },

  /**
   * Registra un nuevo usuario.
   * POST /api/auth/register
   * @param data Datos de registro.
   * @returns void.
   */
  async register(data: {
    name: string
    email: string
    password: string
    role: 'COMPANY' | 'CLIENT'
    owner: string
  }): Promise<void> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = (await response.json()) as { message?: string }
      throw new Error(error.message ?? 'Error al registrar usuario.')
    }
  },

  /**
   * Verifica si un token JWT ha expirado.
   * @param token El token JWT.
   * @returns true si el token expiró o es inválido, false de lo contrario.
   */
  isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return true

      const base64Url = parts[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )

      const payload = JSON.parse(jsonPayload) as { exp?: number }
      if (!payload.exp) return false

      const now = Math.floor(Date.now() / 1000)
      return now >= payload.exp
    } catch {
      return true
    }
  },

  /**
   * Obtiene el token almacenado.
   * @returns Token o null si no hay sesion.
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null

    try {
      const parsed = JSON.parse(raw) as AuthToken
      if (parsed.token && this.isTokenExpired(parsed.token)) {
        this.clearToken()
        return null
      }
      return raw
    } catch {
      this.clearToken()
      return null
    }
  },

  /**
   * Almacena el token en localStorage.
   * @param authToken Token y datos del usuario.
   */
  setToken(authToken: AuthToken): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(TOKEN_KEY, JSON.stringify(authToken))
  },

  /**
   * Elimina el token de sesion.
   */
  clearToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(TOKEN_KEY)
  },

  /**
   * Obtiene los datos de sesion actuales.
   * @returns Datos del usuario o null.
   */
  getSession(): AuthToken['user'] | null {
    const raw = this.getToken()
    if (!raw) return null

    try {
      const parsed = JSON.parse(raw) as AuthToken
      return parsed.user
    } catch {
      return null
    }
  },

  /**
   * Construye los headers de autenticacion para llamadas a la API.
   * @returns Headers con Authorization Bearer.
   */
  getAuthHeaders(): Record<string, string> {
    const raw = this.getToken()
    if (!raw) return {}

    try {
      const parsed = JSON.parse(raw) as AuthToken
      return { Authorization: `Bearer ${parsed.token}` }
    } catch {
      return {}
    }
  },

  /**
   * Cambia la contrasena del usuario autenticado.
   * PATCH /api/auth/change-password
   * @param currentPassword Contrasena actual.
   * @param newPassword Nueva contrasena.
   */
  async changePassword(newPassword: string, currentPassword?: string): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    const data = (await res.json().catch(() => ({}))) as AuthToken & { message?: string }

    if (!res.ok) {
      throw new Error(data.message ?? 'Error al cambiar contrasena.')
    }

    if (data.token) {
      this.setToken(data)
    }
  },
}
