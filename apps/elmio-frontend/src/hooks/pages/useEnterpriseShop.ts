'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '@/src/services/auth.service'
import { enterpriseService, type Enterprise } from '@/src/services/empresa.service'
import { productService, type Product } from '@/src/services/product.service'

interface PurchaseDraft {
  product: Product
  currentStep: number
  paymentMethod: string
  paymentReference: string
  customNotes: string
  documentName: string
}

interface UseEnterpriseShopReturn {
  enterprise: Enterprise | null
  products: Product[]
  filteredProducts: Product[]
  loading: boolean
  error: string | null
  successMessage: string | null
  search: string
  setSearch: (value: string) => void
  purchaseDraft: PurchaseDraft | null
  startPurchase: (product: Product) => void
  cancelPurchase: () => void
  setPaymentMethod: (value: string) => void
  setPaymentReference: (value: string) => void
  setCustomNotes: (value: string) => void
  setDocumentName: (value: string) => void
  nextPurchaseStep: () => Promise<void>
  completePurchase: () => Promise<void>
}

/**
 * Hook de la tienda empresarial para listar productos activos y registrar compras.
 * @returns Estado de carga, filtro y flujo de compra del marketplace para empresas.
 */
export function useEnterpriseShop(): UseEnterpriseShopReturn {
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [purchaseDraft, setPurchaseDraft] = useState<PurchaseDraft | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const session = authService.getSession()
      if (session?.role !== 'COMPANY' && session?.role !== 'EMPLOYEE') {
        throw new Error('Esta vista solo esta disponible para empresas y colaboradores.')
      }

      const [currentEnterprise, productList] = await Promise.all([
        session.role === 'COMPANY' ? enterpriseService.getMe() : Promise.resolve(null),
        productService.list(),
      ])

      setEnterprise(currentEnterprise)
      setProducts(productList.filter((product) => product.active))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar la tienda.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return products

    return products.filter((product) => {
      const haystack = [product.name, product.description, product.sku, product.category]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [products, search])

  const startPurchase = (product: Product) => {
    setError(null)
    setPurchaseDraft({
      product,
      currentStep: 0,
      paymentMethod:
        product.windows.find((window) => window.type === 'payment-form')?.config
          .paymentMethods?.[0] ?? '',
      paymentReference: '',
      customNotes: '',
      documentName: '',
    })
  }

  const cancelPurchase = () => {
    setPurchaseDraft(null)
  }

  const setPaymentMethod = (value: string) => {
    setPurchaseDraft((current) => (current ? { ...current, paymentMethod: value } : current))
  }

  const setPaymentReference = (value: string) => {
    setPurchaseDraft((current) => (current ? { ...current, paymentReference: value } : current))
  }

  const setCustomNotes = (value: string) => {
    setPurchaseDraft((current) => (current ? { ...current, customNotes: value } : current))
  }

  const setDocumentName = (value: string) => {
    setPurchaseDraft((current) => (current ? { ...current, documentName: value } : current))
  }

  const nextPurchaseStep = async () => {
    if (!purchaseDraft) return

    const windows = [...purchaseDraft.product.windows].sort((a, b) => a.order - b.order)
    const window = windows[purchaseDraft.currentStep]
    if (!window) return

    if (window.type === 'payment-form' && window.required) {
      if (!purchaseDraft.paymentMethod.trim() || !purchaseDraft.paymentReference.trim()) {
        setError('Completa el metodo y la referencia de pago para continuar.')
        return
      }
    }

    if (
      window.type === 'document-upload' &&
      window.required &&
      !purchaseDraft.documentName.trim()
    ) {
      setError('Debes indicar el documento cargado para continuar.')
      return
    }

    setError(null)
    setPurchaseDraft((current) =>
      current ? { ...current, currentStep: current.currentStep + 1 } : current,
    )
  }

  const completePurchase = async () => {
    if (!purchaseDraft) return

    const amount = purchaseDraft.product.priceLists[0]?.amount ?? 0
    if (amount <= 0) {
      setError('El producto no tiene un precio principal configurado.')
      return
    }

    try {
      setError(null)
      const session = authService.getSession()
      if (session?.role === 'COMPANY') {
        if (!enterprise) {
          throw new Error('No se encontro la empresa asociada a la sesion.')
        }

        await enterpriseService.createTransaction(enterprise.id, {
          kind: 'charge',
          concept: `Compra marketplace: ${purchaseDraft.product.name}`,
          amount,
          status: 'pending',
        })
      } else {
        await enterpriseService.createMyTransaction({
          kind: 'charge',
          concept: `Compra marketplace: ${purchaseDraft.product.name}`,
          amount,
          status: 'pending',
        })
      }

      setSuccessMessage('Compra registrada en el estado de cuenta.')
      setPurchaseDraft(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrar la compra.'
      setError(message)
    }
  }

  return {
    enterprise,
    products,
    filteredProducts,
    loading,
    error,
    successMessage,
    search,
    setSearch,
    purchaseDraft,
    startPurchase,
    cancelPurchase,
    setPaymentMethod,
    setPaymentReference,
    setCustomNotes,
    setDocumentName,
    nextPurchaseStep,
    completePurchase,
  }
}
