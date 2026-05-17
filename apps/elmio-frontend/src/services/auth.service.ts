const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

type UserRole = 'ADMIN' | 'COMPANY' | 'EMPLOYEE' | 'CLIENT'

interface AuthToken {
  token: string
  user: {
    userId: string
    email: string
    role: UserRole
    owner: string
  }
}

const TOKEN_KEY = 'elmio-auth-token'

/**
 * Servicio de autenticacion del frontend.
 * Gestiona login, registro y almacenamiento del token en localStorage.
 */
export const authService = {
  /**
   * Inicia sesion con email y password.
   * POST /api/auth/login
   * @param email Email del usuario.
   * @param password Password del usuario.
   * @returns Token de sesion y datos del usuario.
   */
  async login(email: string, password: string): Promise<AuthToken> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error('Credenciales invalidas.')
    }

    const data = (await response.json()) as AuthToken
    this.setToken(data)

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
   * Obtiene el token almacenado.
   * @returns Token o null si no hay sesion.
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
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
}
