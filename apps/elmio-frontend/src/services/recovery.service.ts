const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export interface RequestRecoveryResponse {
  channel: 'whatsapp' | 'email'
  message: string
}

export interface VerifyCodeResponse {
  resetToken: string
}

export interface ResetPasswordResponse {
  message: string
}

export interface RecoveryAvailabilityResponse {
  available: boolean
  whatsappReady: boolean
  emailConfigured: boolean
}

export const RECOVERY_UNAVAILABLE_MESSAGE =
  'En estos momentos la recuperacion de contraseña no esta disponible, intente mas tarde'

/**
 * Servicio para consumir la API de recuperacion de contrasenas en el backend.
 */
export const recoveryService = {
  /**
   * Consulta si los canales de recuperacion (WhatsApp o email)
   * estan operativos antes de habilitar el formulario en el frontend.
   * GET /api/password-recovery/availability
   * @returns Banderas individuales y un `available` agregado.
   */
  async checkAvailability(): Promise<RecoveryAvailabilityResponse> {
    const response = await fetch(`${API_BASE}/password-recovery/availability`, {
      method: 'GET',
    })

    const data = (await response.json().catch(() => ({}))) as Partial<RecoveryAvailabilityResponse>

    if (!response.ok) {
      throw new Error('No se pudo consultar la disponibilidad de recuperacion.')
    }

    return {
      available: data.available === true,
      whatsappReady: data.whatsappReady === true,
      emailConfigured: data.emailConfigured === true,
    }
  },

  /**
   * Solicita un codigo OTP de 6 digitos.
   * POST /api/password-recovery/request
   */
  async request(email: string): Promise<RequestRecoveryResponse> {
    const response = await fetch(`${API_BASE}/password-recovery/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = (await response.json().catch(() => ({}))) as RequestRecoveryResponse & {
      message?: string
    }

    if (!response.ok) {
      throw new Error(data.message ?? 'Error al solicitar el código de recuperación.')
    }

    return data
  },

  /**
   * Verifica el codigo OTP y devuelve un token JWT temporal.
   * POST /api/password-recovery/verify
   */
  async verify(email: string, code: string): Promise<VerifyCodeResponse> {
    const response = await fetch(`${API_BASE}/password-recovery/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })

    const data = (await response.json().catch(() => ({}))) as VerifyCodeResponse & {
      message?: string
    }

    if (!response.ok) {
      throw new Error(data.message ?? 'Código de verificación incorrecto o expirado.')
    }

    return data
  },

  /**
   * Restablece la contrasena usando el token JWT temporal.
   * POST /api/password-recovery/reset
   */
  async reset(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    const response = await fetch(`${API_BASE}/password-recovery/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    })

    const data = (await response.json().catch(() => ({}))) as ResetPasswordResponse & {
      message?: string
    }

    if (!response.ok) {
      throw new Error(data.message ?? 'Error al restablecer la contraseña.')
    }

    return data
  },
}
