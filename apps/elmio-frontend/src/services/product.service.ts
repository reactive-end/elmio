const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

import { authService } from './auth.service'

// --- Domain types (mirror backend) ---

export type ProductType = 'PRODUCT' | 'SERVICE' | 'KIT' | 'LOAN'
export type PaymentMode = 'cash' | 'quota' | 'mixed'

export interface FinancingScheme {
  id: string
  name: string
  paymentMode: PaymentMode
  paymentPeriod: string
  maxQuotas: number
  initialPayment: number
}
export type PriceSource = 'manual' | 'third-party'
export type WindowActionType =
  | 'payment-form'
  | 'custom-form'
  | 'external-redirect'
  | 'document-upload'
  | 'confirmation-dialog'

export interface PriceList {
  id: string
  currency: string
  amount: number
  source: PriceSource
  thirdPartyProvider: string | null
  thirdPartyRef: string | null
  lastSyncAt: string | null
}

export interface DiscountPeriod {
  id: string
  startDate: string
  endDate: string
  percentage: number
  description: string
}

export interface ProductAttribute {
  id: string
  name: string
  value: string
}

export interface FormField {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'file' | 'checkbox'
  required: boolean
  placeholder: string
  options: string[]
}

export interface WindowConfig {
  redirectUrl?: string
  fields?: FormField[]
  paymentMethods?: string[]
  acceptedFileTypes?: string[]
  confirmationMessage?: string
}

export interface ProductWindow {
  id: string
  type: WindowActionType
  label: string
  description: string
  config: WindowConfig
  order: number
  required: boolean
}

export interface ProductAction {
  id: string
  type: 'disburse_funds' | 'send_email_voucher' | 'custom_webhook'
  name: string
  active: boolean
  config: Record<string, any>
}

export interface Product {
  id: string
  sku: string
  name: string
  description: string
  type: ProductType
  category: string
  tags: string[]
  images: string[]
  active: boolean
  hasStock: boolean
  currentStock: number
  minimumStock: number
  hasValidity: boolean
  validFrom: string | null
  validTo: string | null
  attributes: ProductAttribute[]
  priceLists: PriceList[]
  discounts: DiscountPeriod[]
  financingSchemes: FinancingScheme[]
  interestType: 'none' | 'percentage' | 'fixed'
  interestRate: number
  usesThirdPartyPricing: boolean
  globalThirdPartyProvider: string | null
  windows: ProductWindow[]
  actions?: ProductAction[]
  marketplaceId: string | null
  alternativeBankAccountId?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateProductInput {
  sku: string
  name: string
  description: string
  type: ProductType
  category: string
  tags: string[]
  images: string[]
  hasStock?: boolean
  currentStock: number
  minimumStock: number
  hasValidity: boolean
  validFrom: string | null
  validTo: string | null
  attributes: ProductAttribute[]
  priceLists: Omit<PriceList, 'id'>[]
  discounts: Omit<DiscountPeriod, 'id'>[]
  financingSchemes: FinancingScheme[]
  interestType?: 'none' | 'percentage' | 'fixed'
  interestRate: number
  usesThirdPartyPricing: boolean
  globalThirdPartyProvider?: string | null
  windows: Omit<ProductWindow, 'id'>[]
  actions?: Omit<ProductAction, 'id'>[]
  marketplaceId: string | null
  alternativeBankAccountId?: string | null
}

export type UpdateProductInput = Partial<Product> | CreateProductInput

// --- Helpers ---

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authService.getAuthHeaders(),
    ...(init?.headers as Record<string, string> | undefined),
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers })
}

/**
 * Servicio del modulo de productos.
 */
export const productService = {
  async list(): Promise<Product[]> {
    const res = await authedFetch('/products')
    if (!res.ok) throw new Error('Error al listar productos.')
    return (await res.json()) as Product[]
  },

  async getById(id: string): Promise<Product> {
    const res = await authedFetch(`/products/${id}`)
    if (!res.ok) throw new Error('Producto no encontrado.')
    return (await res.json()) as Product
  },

  async create(data: CreateProductInput): Promise<Product> {
    const res = await authedFetch('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = (await res.json()) as { message?: string }
      throw new Error(err.message ?? 'Error al crear producto.')
    }
    return (await res.json()) as Product
  },

  async update(id: string, data: UpdateProductInput): Promise<Product> {
    const res = await authedFetch(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al actualizar producto.')
    return (await res.json()) as Product
  },

  async remove(id: string): Promise<void> {
    const res = await authedFetch(`/products/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error al eliminar producto.')
  },
}
