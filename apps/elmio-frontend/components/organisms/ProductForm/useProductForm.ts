'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  productService,
  type ProductType,
  type PaymentMode,
  type PriceSource,
  type ProductAttribute,
  type WindowActionType,
  type CreateProductInput,
  type ProductAction,
} from '@/src/services/product.service'
import { categoryService, type Categoria } from '@/src/services/category.service'

interface PriceListDraft {
  id: string
  currency: string
  amount: number
  source: PriceSource
  thirdPartyProvider: string
  thirdPartyRef: string
}

interface DiscountDraft {
  id: string
  startDate: string
  endDate: string
  percentage: number
  description: string
}

interface WindowDraft {
  id: string
  type: WindowActionType
  label: string
  description: string
  order: number
  required: boolean
  redirectUrl: string
  paymentMethods: string
  acceptedFileTypes: string
  confirmationMessage: string
  actionKey: string
}

interface AlertState {
  type: 'error' | 'success' | 'info'
  message: string
}

const LAST_STEP = 6
const MANAGED_PAYMENT_PROVIDERS = new Set([
  'elmio:mercantil-vida',
  'elmio:mercantil-accidentes',
  'elmio:mercantil-funeraria',
])
const MAX_WINDOWS = 1

export function useProductForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get('id')
  const isEdit = Boolean(productId)

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState<AlertState | null>(null)

  // Step 1: Basic
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')

  const generateRandomSku = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = 'PROD-'
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setSku(result)
  }
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ProductType>('PRODUCT')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<Categoria[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Cargar categorias activas
  useEffect(() => {
    categoryService
      .list()
      .then((data) => {
        const activeCategories = data.filter((c) => c.active)
        setCategories(activeCategories)
        // Seleccionar la primera por defecto si existe
        if (activeCategories.length > 0) {
          setCategory(activeCategories[0].id)
        }
      })
      .catch((err) => {
        console.error('Error al cargar categorias:', err)
      })
  }, [])

  // Step 2: Inventory
  const [hasStock, setHasStock] = useState(true)
  const [currentStock, setCurrentStock] = useState(0)
  const [minimumStock, setMinimumStock] = useState(0)
  const [hasValidity, setHasValidity] = useState(false)
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')

  // Step 3: Attributes & Images
  const [attributes, setAttributes] = useState<ProductAttribute[]>([])
  const [images, setImages] = useState<string[]>([])
  const [imageInput, setImageInput] = useState('')

  // Step 4: Prices & Payment
  const [priceLists, setPriceLists] = useState<PriceListDraft[]>([])
  const [discounts, setDiscounts] = useState<DiscountDraft[]>([])
  const [usesThirdParty, setUsesThirdParty] = useState(false)
  const [globalThirdPartyProvider, setGlobalThirdPartyProvider] = useState('')

  // Step 4: Payment
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash')
  const [paymentPeriod, setPaymentPeriod] = useState<string>('monthly')
  const [maxQuotas, setMaxQuotas] = useState(1)
  const [interestType, setInterestType] = useState<'none' | 'percentage' | 'fixed'>('none')
  const [interestRate, setInterestRate] = useState(0)
  const [initialPayment, setInitialPayment] = useState(0)

  const [isSubmitBlocked, setIsSubmitBlocked] = useState(false)

  // Step 5: Windows
  const [windows, setWindows] = useState<WindowDraft[]>([])

  // Step 6: Actions
  const [actions, setActions] = useState<ProductAction[]>([])

  const usesProviderManagedPayment =
    usesThirdParty && MANAGED_PAYMENT_PROVIDERS.has(globalThirdPartyProvider)
  const isThirdPartyProviderPending = usesThirdParty && !globalThirdPartyProvider

  // Cargar datos en modo edicion
  useEffect(() => {
    if (!productId) return

    async function loadProductData() {
      try {
        setIsLoading(true)
        const product = await productService.getById(productId!)

        setSku(product.sku)
        setName(product.name)
        setDescription(product.description || '')
        setType(product.type)
        setCategory(product.category || '')
        setTags(product.tags || [])
        setHasStock(product.hasStock)
        setCurrentStock(product.currentStock)
        setMinimumStock(product.minimumStock)
        setHasValidity(product.hasValidity)
        setValidFrom(product.validFrom || '')
        setValidTo(product.validTo || '')
        setAttributes(product.attributes || [])
        setImages(product.images || [])

        setPriceLists(
          product.priceLists.map((p) => ({
            id: p.id || crypto.randomUUID(),
            currency: p.currency,
            amount: p.amount,
            source: p.source,
            thirdPartyProvider: p.thirdPartyProvider || '',
            thirdPartyRef: p.thirdPartyRef || '',
          })),
        )

        setDiscounts(
          product.discounts.map((d) => ({
            id: d.id || crypto.randomUUID(),
            startDate: d.startDate,
            endDate: d.endDate,
            percentage: d.percentage,
            description: d.description,
          })),
        )

        setUsesThirdParty(product.usesThirdPartyPricing)
        setGlobalThirdPartyProvider(product.globalThirdPartyProvider || '')
        setPaymentMode(product.paymentMode)
        setPaymentPeriod(product.paymentPeriod || 'monthly')
        setMaxQuotas(product.maxQuotas)
        setInterestType(product.interestType)
        setInterestRate(product.interestRate)
        setInitialPayment(product.initialPayment)

        setWindows(
          product.windows.slice(0, MAX_WINDOWS).map((w) => ({
            id: w.id || crypto.randomUUID(),
            type: w.type,
            label: w.label || '',
            description: w.description || '',
            order: w.order,
            required: w.required,
            redirectUrl: w.config.redirectUrl || '',
            paymentMethods: w.config.paymentMethods?.join(', ') || '',
            acceptedFileTypes: w.config.acceptedFileTypes?.join(', ') || '',
            confirmationMessage: w.config.confirmationMessage || '',
            actionKey:
              w.type === 'payment-form'
                ? w.config.paymentMethods?.[0] || 'pay-cash'
                : w.type === 'custom-form'
                  ? w.config.redirectUrl || 'mercantil-query-form'
                  : w.config.redirectUrl || '',
          })),
        )

        setActions(
          product.actions?.map((a) => ({
            id: a.id || crypto.randomUUID(),
            type: a.type,
            name: a.name,
            active: a.active,
            config: a.config || {},
          })) || [],
        )
      } catch (err) {
        console.error('Error al cargar datos del producto en edicion:', err)
        setAlert({ type: 'error', message: 'No se pudo cargar la informacion del producto.' })
      } finally {
        setIsLoading(false)
      }
    }

    void loadProductData()
  }, [productId])

  // Navigation
  const handleNext = () => {
    setStep((s) => {
      const nextStep = Math.min(LAST_STEP, s + 1)
      if (nextStep === LAST_STEP) {
        setIsSubmitBlocked(true)
        setTimeout(() => setIsSubmitBlocked(false), 400)
      }
      return nextStep
    })
  }
  const handleBack = () => setStep((s) => Math.max(1, s - 1))

  // Attributes
  const addAttribute = () =>
    setAttributes((p) => [...p, { id: crypto.randomUUID(), name: '', value: '' }])
  const updAttribute = (id: string, field: string, value: string) =>
    setAttributes((p) => p.map((a) => (a.id === id ? { ...a, [field]: value } : a)))
  const remAttribute = (id: string) => setAttributes((p) => p.filter((a) => a.id !== id))

  // Images
  const addImage = () => {
    if (imageInput.trim()) {
      setImages((p) => [...p, imageInput.trim()])
      setImageInput('')
    }
  }
  const addImageFromGallery = (url: string) => {
    if (url && !images.includes(url)) {
      setImages((p) => [...p, url])
    }
  }
  const remImage = (url: string) => setImages((p) => p.filter((i) => i !== url))

  // Tags
  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((p) => [...p, trimmed])
      setTagInput('')
    }
  }
  const remTag = (tag: string) => setTags((p) => p.filter((t) => t !== tag))

  // Prices
  const addPrice = () =>
    setPriceLists((p) => [
      ...p,
      {
        id: crypto.randomUUID(),
        currency: 'USD',
        amount: 0,
        source: 'manual',
        thirdPartyProvider: '',
        thirdPartyRef: '',
      },
    ])
  const updPrice = (id: string, field: string, value: string | number) =>
    setPriceLists((p) => p.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  const remPrice = (id: string) => setPriceLists((p) => p.filter((l) => l.id !== id))

  // Discounts
  const addDiscount = () =>
    setDiscounts((p) => [
      ...p,
      { id: crypto.randomUUID(), startDate: '', endDate: '', percentage: 0, description: '' },
    ])
  const updDiscount = (id: string, field: string, value: string | number) =>
    setDiscounts((p) => p.map((d) => (d.id === id ? { ...d, [field]: value } : d)))
  const remDiscount = (id: string) => setDiscounts((p) => p.filter((d) => d.id !== id))

  // Windows
  const addWindow = () =>
    setWindows((p) => {
      if (p.length >= MAX_WINDOWS) return p
      return [
        ...p,
        {
          id: crypto.randomUUID(),
          type: 'payment-form',
          label: '',
          description: '',
          order: p.length,
          required: false,
          redirectUrl: '',
          paymentMethods: '',
          acceptedFileTypes: '',
          confirmationMessage: '',
          actionKey: 'pay-cash',
        },
      ]
    })
  const updWindow = (id: string, field: string, value: string | number | boolean) =>
    setWindows((p) => p.map((w) => (w.id === id ? { ...w, [field]: value } : w)))
  const remWindow = (id: string) => setWindows((p) => p.filter((w) => w.id !== id))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (step < LAST_STEP) return // Evitar submit accidental al cambiar de pasos
    setAlert(null)

    if (!sku.trim()) {
      setAlert({ type: 'error', message: 'El SKU es obligatorio.' })
      return
    }
    if (!name.trim()) {
      setAlert({ type: 'error', message: 'El nombre es obligatorio.' })
      return
    }
    if (usesThirdParty && !globalThirdPartyProvider.trim()) {
      setAlert({ type: 'error', message: 'Selecciona un proveedor de precios de terceros.' })
      return
    }

    try {
      setIsLoading(true)

      const input: CreateProductInput = {
        sku: sku.trim(),
        name: name.trim(),
        description: description.trim(),
        type,
        category: category.trim(),
        tags,
        images,
        currentStock: hasStock ? currentStock : 0,
        minimumStock: hasStock ? minimumStock : 0,
        hasValidity,
        validFrom: hasValidity ? validFrom : null,
        validTo: hasValidity ? validTo : null,
        attributes,
        priceLists: usesThirdParty
          ? []
          : priceLists.map((p) => ({
              currency: p.currency,
              amount: p.amount,
              source: p.source,
              thirdPartyProvider: p.source === 'third-party' ? p.thirdPartyProvider : null,
              thirdPartyRef: p.source === 'third-party' ? p.thirdPartyRef : null,
              lastSyncAt: null,
            })),
        discounts: usesThirdParty
          ? []
          : discounts.map((d) => ({
              startDate: d.startDate,
              endDate: d.endDate,
              percentage: d.percentage,
              description: d.description,
            })),
        paymentMode: usesProviderManagedPayment ? 'cash' : paymentMode,
        paymentPeriod: usesProviderManagedPayment || paymentMode === 'cash' ? null : paymentPeriod,
        maxQuotas: usesProviderManagedPayment ? 1 : maxQuotas,
        interestType: usesProviderManagedPayment ? 'none' : interestType,
        interestRate: usesProviderManagedPayment ? 0 : interestType === 'none' ? 0 : interestRate,
        initialPayment: usesProviderManagedPayment ? 0 : initialPayment,
        usesThirdPartyPricing: usesThirdParty,
        globalThirdPartyProvider: usesThirdParty ? globalThirdPartyProvider : null,
        windows: windows.slice(0, MAX_WINDOWS).map((w) => {
          const defaultLabel =
            w.type === 'payment-form'
              ? 'Formulario de pago'
              : w.type === 'custom-form'
                ? 'Formulario personalizado'
                : 'Redireccion externa'
          return {
            type: w.type,
            label: defaultLabel,
            description: 'Accion de compra del producto',
            order: w.order,
            required: true,
            config: {
              redirectUrl: w.type !== 'payment-form' ? w.actionKey : undefined,
              paymentMethods: w.type === 'payment-form' ? [w.actionKey] : undefined,
            },
          }
        }),
        marketplaceId: null,
        actions: actions.map((a) => ({
          type: a.type,
          name: a.name,
          active: a.active,
          config: a.config,
        })),
      }

      if (isEdit) {
        await productService.update(productId!, input)
        setAlert({ type: 'success', message: 'Producto actualizado exitosamente.' })
      } else {
        await productService.create(input)
        setAlert({ type: 'success', message: 'Producto creado exitosamente.' })
      }
      setTimeout(() => router.push('/dashboard/products'), 1500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el producto.'
      setAlert({ type: 'error', message: msg })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    step,
    isLoading,
    alert,
    setAlert,
    sku,
    setSku,
    generateRandomSku,
    name,
    setName,
    description,
    setDescription,
    type,
    setType,
    category,
    setCategory,
    categories,
    tags,
    setTags,
    tagInput,
    setTagInput,
    addTag,
    remTag,
    currentStock,
    setCurrentStock,
    minimumStock,
    setMinimumStock,
    hasStock,
    setHasStock,
    hasValidity,
    setHasValidity,
    validFrom,
    setValidFrom,
    validTo,
    setValidTo,
    attributes,
    addAttribute,
    updAttribute,
    remAttribute,
    images,
    imageInput,
    setImageInput,
    addImage,
    addImageFromGallery,
    remImage,
    priceLists,
    addPrice,
    updPrice,
    remPrice,
    discounts,
    addDiscount,
    updDiscount,
    remDiscount,
    usesThirdParty,
    setUsesThirdParty,
    globalThirdPartyProvider,
    usesProviderManagedPayment,
    isThirdPartyProviderPending,
    setGlobalThirdPartyProvider,
    paymentMode,
    setPaymentMode,
    paymentPeriod,
    setPaymentPeriod,
    maxQuotas,
    setMaxQuotas,
    interestType,
    setInterestType,
    interestRate,
    setInterestRate,
    initialPayment,
    setInitialPayment,
    isSubmitBlocked,
    windows,
    addWindow,
    updWindow,
    remWindow,
    actions,
    setActions,
    handleNext,
    handleBack,
    handleSubmit,
    isEdit,
  }
}
