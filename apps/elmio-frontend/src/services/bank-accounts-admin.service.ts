import { authService } from './auth.service'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export interface BankItem {
  id: string
  bankCode: string
  bankName: string
  isActive: boolean
}

export interface CurrencyItem {
  id: string
  name: string
  code: string
  symbol: string
  isActive: boolean
  exchangeRate: number
}

export interface BankAccountTypeItem {
  id: string
  accountType: string
}

export interface BankAccountItem {
  id: string
  bank: BankItem
  accountNumber: string
  documentType: string
  documentNumber: string
  phoneNumber: string
  phoneValidationNumber: string
  businessName: string
  accountType: BankAccountTypeItem
  description: string
  currency: CurrencyItem
  createdAt: string
  updatedAt: string
}

export interface SaveBankAccountInput {
  bankId: string
  accountNumber: string
  documentType: string
  documentNumber: string
  phoneNumber: string
  phoneValidationNumber?: string
  businessName?: string
  accountTypeId: string
  description?: string
  currencyId: string
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
    throw new Error(error.message ?? 'Error al procesar la configuración de cuentas bancarias.')
  }

  return response.json() as Promise<T>
}

/**
 * Servicio frontend para la administración de cuentas bancarias por administradores.
 */
export const bankAccountsAdminService = {
  /**
   * Obtiene la lista de cuentas bancarias.
   */
  async list(): Promise<BankAccountItem[]> {
    return apiFetch<BankAccountItem[]>('/bank-accounts', {
      method: 'GET',
    })
  },

  /**
   * Obtiene el detalle de una cuenta bancaria por su ID.
   */
  async getById(id: string): Promise<BankAccountItem> {
    return apiFetch<BankAccountItem>(`/bank-accounts/${encodeURIComponent(id)}`, {
      method: 'GET',
    })
  },

  /**
   * Registra una nueva cuenta bancaria corporativa.
   */
  async create(input: SaveBankAccountInput): Promise<BankAccountItem> {
    return apiFetch<BankAccountItem>('/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  /**
   * Actualiza una cuenta bancaria existente.
   */
  async update(id: string, input: Partial<SaveBankAccountInput>): Promise<BankAccountItem> {
    return apiFetch<BankAccountItem>(`/bank-accounts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  },

  /**
   * Elimina una cuenta bancaria.
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/bank-accounts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },

  /**
   * Obtiene el catálogo de bancos activos.
   */
  async listBanks(): Promise<BankItem[]> {
    return apiFetch<BankItem[]>('/banks', {
      method: 'GET',
    })
  },

  /**
   * Obtiene el catálogo de monedas activas.
   */
  async listCurrencies(): Promise<CurrencyItem[]> {
    return apiFetch<CurrencyItem[]>('/currencies', {
      method: 'GET',
    })
  },

  /**
   * Obtiene una moneda por su ID.
   */
  async getCurrencyById(id: string): Promise<CurrencyItem> {
    return apiFetch<CurrencyItem>(`/currencies/${encodeURIComponent(id)}`, {
      method: 'GET',
    })
  },

  /**
   * Registra una nueva moneda en el sistema.
   */
  async createCurrency(input: { code: string; name: string; symbol: string; exchangeRate?: number }): Promise<CurrencyItem> {
    return apiFetch<CurrencyItem>('/currencies', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  /**
   * Actualiza una moneda existente.
   */
  async updateCurrency(id: string, input: { name?: string; symbol?: string; exchangeRate?: number }): Promise<CurrencyItem> {
    return apiFetch<CurrencyItem>(`/currencies/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  },

  /**
   * Elimina una moneda del sistema.
   */
  async deleteCurrency(id: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/currencies/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },

  /**
   * Consulta la tasa de cambio vigente del Dólar (USD) a Bolívares (VES) en Banco R4.
   */
  async getR4DollarRate(): Promise<number> {
    const today = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'
    interface R4RateResponse { success: boolean; exchangeRate: number }
    const res = await apiFetch<R4RateResponse>('/banco-r4/consulta/tasa', {
      method: 'POST',
      body: JSON.stringify({
        date: today,
        currency: 'USD',
      }),
    })
    return res.exchangeRate
  },

  /**
   * Obtiene el catálogo de tipos de cuenta.
   */
  async listAccountTypes(): Promise<BankAccountTypeItem[]> {
    return apiFetch<BankAccountTypeItem[]>('/bank-account-types', {
      method: 'GET',
    })
  },
}
