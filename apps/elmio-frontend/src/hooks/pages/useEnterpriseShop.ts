'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '@/src/services/auth.service'
import { categoryService, type Categoria } from '@/src/services/category.service'
import { enterpriseService, type Enterprise } from '@/src/services/empresa.service'
import { productService, type Product } from '@/src/services/product.service'

const MERCANTIL_CUSTOM_FORM_ACTION = 'mercantil-query-form'
const MERCANTIL_RCV_CUSTOM_FORM_ACTION = 'mercantil-rcv-query-form'
const MERCANTIL_PROVIDER_SLUGS: Record<string, string> = {
  'elmio:mercantil-vida': 'life',
  'elmio:mercantil-accidentes': 'personalAccidents',
  'elmio:mercantil-funeraria': 'funerary',
}

interface MercantilEmbeddedMessage {
  amount?: number
  policyCount?: number
  shopcartId?: string
  source?: string
  type?: 'completed' | 'cancelled'
}

interface PurchaseDraft {
  product: Product
  currentStep: number
  paymentMethod: string
  paymentReference: string
  customNotes: string
  documentName: string
  customFormAmount: number | null
}

interface UseEnterpriseShopReturn {
  enterprise: Enterprise | null
  products: Product[]
  categories: Categoria[]
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
  embeddedFormUrl: string | null
  closeEmbeddedForm: () => void
}

/**
 * Construye la URL embebida del flujo Mercantil para el producto seleccionado.
 * @param {Product} product - Producto actualmente en compra.
 * @returns {string} Ruta relativa lista para ser usada en un iframe.
 */
function buildMercantilEmbeddedUrl(product: Product): string {
  const params = new URLSearchParams({ embedded: '1' })
  const provider = product.globalThirdPartyProvider ?? ''
  const slug = MERCANTIL_PROVIDER_SLUGS[provider]
  if (slug) {
    params.set('slug', slug)
  }
  return `/mercantil/consulta?${params.toString()}`
}

/**
 * Construye la URL embebida del flujo RCV Mercantil.
 * @returns {string} Ruta relativa lista para ser usada en un iframe.
 */
function buildMercantilRCVEmbeddedUrl(): string {
  const params = new URLSearchParams({ embedded: '1' })
  return `/mercantil/consulta-rcv?${params.toString()}`
}

/**
 * Hook de la tienda empresarial para listar productos activos y registrar compras.
 * @returns Estado de carga, filtro y flujo de compra del marketplace para empresas.
 */
export function useEnterpriseShop(): UseEnterpriseShopReturn {
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [purchaseDraft, setPurchaseDraft] = useState<PurchaseDraft | null>(null)
  const [embeddedFormUrl, setEmbeddedFormUrl] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const session = authService.getSession()
      if (session?.role !== 'COMPANY' && session?.role !== 'EMPLOYEE') {
        throw new Error('Esta vista solo esta disponible para empresas y colaboradores.')
      }

      const [currentEnterprise, productList, categoryList] = await Promise.all([
        session.role === 'COMPANY' ? enterpriseService.getMe() : Promise.resolve(null),
        productService.list(),
        categoryService.list(),
      ])

      setEnterprise(currentEnterprise)
      setProducts(productList)
      setCategories(categoryList)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar la tienda.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  useEffect(() => {
    const handleMessage = (event: MessageEvent<MercantilEmbeddedMessage>) => {
      if (event.origin !== window.location.origin || !embeddedFormUrl) return

      const data = event.data
      if (!data || data.source !== 'mercantil-consulta') return

      if (data.type === 'completed') {
        setEmbeddedFormUrl(null)
        setError(null)
        setPurchaseDraft((current) =>
          current
            ? {
                ...current,
                currentStep: current.currentStep + 1,
                customFormAmount:
                  typeof data.amount === 'number' && data.amount > 0
                    ? data.amount
                    : current.customFormAmount,
              }
            : current,
        )
      }

      if (data.type === 'cancelled') {
        setEmbeddedFormUrl(null)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [embeddedFormUrl])

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
    setEmbeddedFormUrl(null)
    setPurchaseDraft({
      product,
      currentStep: 0,
      paymentMethod:
        product.windows.find((window) => window.type === 'payment-form')?.config
          .paymentMethods?.[0] ?? '',
      paymentReference: '',
      customNotes: '',
      documentName: '',
      customFormAmount: null,
    })
  }

  const cancelPurchase = () => {
    setEmbeddedFormUrl(null)
    setPurchaseDraft(null)
  }

  const closeEmbeddedForm = () => {
    setEmbeddedFormUrl(null)
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
    const session = authService.getSession()

    if (
      window.type === 'custom-form' &&
      window.config.redirectUrl === MERCANTIL_CUSTOM_FORM_ACTION
    ) {
      if (session?.role !== 'COMPANY') {
        setError('La consulta Mercantil embebida solo esta disponible para empresas por ahora.')
        return
      }

      setError(null)
      setEmbeddedFormUrl(buildMercantilEmbeddedUrl(purchaseDraft.product))
      return
    }

    if (
      window.type === 'custom-form' &&
      window.config.redirectUrl === MERCANTIL_RCV_CUSTOM_FORM_ACTION
    ) {
      if (session?.role !== 'COMPANY') {
        setError('La consulta RCV Mercantil embebida solo esta disponible para empresas por ahora.')
        return
      }

      setError(null)
      setEmbeddedFormUrl(buildMercantilRCVEmbeddedUrl())
      return
    }

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

    const amount =
      purchaseDraft.customFormAmount ?? purchaseDraft.product.priceLists[0]?.amount ?? 0
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
    categories,
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
    embeddedFormUrl,
    closeEmbeddedForm,
  }
}
