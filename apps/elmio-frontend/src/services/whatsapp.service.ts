import { authService } from './auth.service'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export type WhatsAppStatus = 'DISCONNECTED' | 'QR_PENDING' | 'AUTHENTICATING' | 'READY' | 'ERROR'

export interface WhatsAppStatusInfo {
  status: WhatsAppStatus
  hasQr: boolean
  connectedPhone?: string
}

/**
 * Servicio para interactuar con los endpoints de administracion de WhatsApp del backend.
 */
export const whatsappService = {
  /**
   * Obtiene el estado actual de la conexion a WhatsApp.
   * GET /api/whatsapp/status
   */
  async getStatus(): Promise<WhatsAppStatusInfo> {
    const response = await fetch(`${API_BASE}/whatsapp/status`, {
      method: 'GET',
      headers: {
        ...authService.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as { message?: string }
      throw new Error(error.message ?? 'Error al obtener el estado de WhatsApp.')
    }

    return response.json() as Promise<WhatsAppStatusInfo>
  },

  /**
   * Obtiene la URL de la imagen del codigo QR actual en formato base64.
   * GET /api/whatsapp/qr
   */
  async getQr(): Promise<{ qr: string | null }> {
    const response = await fetch(`${API_BASE}/whatsapp/qr`, {
      method: 'GET',
      headers: {
        ...authService.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as { message?: string }
      throw new Error(error.message ?? 'Error al obtener el codigo QR de WhatsApp.')
    }

    return response.json() as Promise<{ qr: string | null }>
  },

  /**
   * Cierra la sesion activa de WhatsApp en el servidor y borra la cache local.
   * POST /api/whatsapp/logout
   */
  async logout(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/whatsapp/logout`, {
      method: 'POST',
      headers: {
        ...authService.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as { message?: string }
      throw new Error(error.message ?? 'Error al desvincular WhatsApp.')
    }

    return response.json() as Promise<{ message: string }>
  },

  /**
   * Reinicia el cliente de WhatsApp en el backend.
   * POST /api/whatsapp/restart
   */
  async restart(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/whatsapp/restart`, {
      method: 'POST',
      headers: {
        ...authService.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as { message?: string }
      throw new Error(error.message ?? 'Error al reiniciar WhatsApp.')
    }

    return response.json() as Promise<{ message: string }>
  },

  /**
   * Genera la URL con el token para la conexion por stream SSE (EventSource).
   * @returns URL completa del stream SSE.
   */
  getQrStreamUrl(): string {
    const rawToken = authService.getToken()
    let token = ''
    if (rawToken) {
      try {
        const parsed = JSON.parse(rawToken) as { token: string }
        token = parsed.token
      } catch {}
    }
    return `${API_BASE}/whatsapp/qr-stream?token=${encodeURIComponent(token)}`
  },
}
