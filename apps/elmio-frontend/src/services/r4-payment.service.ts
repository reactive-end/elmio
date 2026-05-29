/**
 * @fileoverview Servicio de API para interactuar con la pasarela de pagos Banco R4 (C2P y Domiciliaciones).
 * @description Provee funciones para Débito Inmediato, Consulta de Tasa BCV, Solicitud de OTP y Domiciliaciones.
 * @module services/r4-payment.service
 */

import { authService } from './auth.service'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export interface GenerateOtpR4Input {
  companyAccountId: string
  bankCode: string
  amount: number
  phoneNumber: string
  nationalId: string
}

export interface GenerateOtpR4Response {
  code: string
  success: boolean
  message: string
}

export interface ImmediateDebitR4Input {
  companyAccountId: string
  bankCode: string
  amount: number
  phoneNumber: string
  nationalId: string
  fullName: string
  otp: string
  concept: string
}

export interface ImmediateDebitR4Response {
  code: string
  message: string
  reference: string
  id: string
  rawResponse: Record<string, any>
}

export interface AccountDirectDebitR4Input {
  companyAccountId: string
  documentId: string
  fullName: string
  accountNumber: string
  amount: number
  concept: string
}

export interface AccountDirectDebitR4Response {
  code: string
  message: string
  uuid: string
  rawResponse: Record<string, any>
}

export interface GetExchangeRateR4Input {
  date: string
  currency: string
  companyAccountId: string
}

export interface GetExchangeRateR4Response {
  success: boolean
  exchangeRate: number
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authService.getAuthHeaders(),
    ...(init?.headers as Record<string, string> | undefined),
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers })
}

/**
 * Servicio del procesador de pagos Banco R4 en frontend.
 */
export const r4PaymentService = {
  /**
   * Obtiene la tasa de cambio oficial del BCV en tiempo real.
   */
  async getExchangeRate(data: GetExchangeRateR4Input): Promise<GetExchangeRateR4Response> {
    const res = await authedFetch('/banco-r4/consulta/tasa', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = (await res.json()) as { message?: string }
      throw new Error(err.message ?? 'Error al obtener la tasa de cambio BCV desde Banco R4.')
    }
    return (await res.json()) as GetExchangeRateR4Response
  },

  /**
   * Solicita el envío de una clave dinámica OTP al cliente mediante Banco R4.
   */
  async generateOtp(data: GenerateOtpR4Input): Promise<GenerateOtpR4Response> {
    const res = await authedFetch('/banco-r4/generate-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = (await res.json()) as { message?: string }
      throw new Error(err.message ?? 'Error al solicitar el código OTP desde Banco R4.')
    }
    return (await res.json()) as GenerateOtpR4Response
  },

  /**
   * Procesa el cobro por Débito Inmediato C2P en caliente con el OTP ingresado.
   */
  async immediateDebit(data: ImmediateDebitR4Input): Promise<ImmediateDebitR4Response> {
    const res = await authedFetch('/banco-r4/immediate-debit', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = (await res.json()) as { message?: string }
      throw new Error(err.message ?? 'Error al procesar el débito inmediato en Banco R4.')
    }
    return (await res.json()) as ImmediateDebitR4Response
  },

  /**
   * Inicia el registro del mandato de domiciliación basado en cuenta de 20 dígitos.
   */
  async directDebitAccount(data: AccountDirectDebitR4Input): Promise<AccountDirectDebitR4Response> {
    const res = await authedFetch('/banco-r4/direct-debit/account', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = (await res.json()) as { message?: string }
      throw new Error(err.message ?? 'Error al registrar la domiciliación por cuenta en Banco R4.')
    }
    return (await res.json()) as AccountDirectDebitR4Response
  },
}
