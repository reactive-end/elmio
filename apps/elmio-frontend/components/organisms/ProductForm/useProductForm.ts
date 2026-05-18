'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  productService,
  type ProductType,
  type PaymentMode,
  type PriceSource,
  type ProductAttribute,
  type WindowActionType,
  type CreateProductInput,
} from '@/src/services/product.service'

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
}

interface AlertState {
  type: 'error' | 'success' | 'info'
  message: string
}

export function useProductForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState<AlertState | null>(null)

  // Step 1: Basic
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ProductType>('PRODUCT')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')

  // Step 2: Inventory
  const [currentStock, setCurrentStock] = useState(0)
  const [minimumStock, setMinimumStock] = useState(0)
  const [hasValidity, setHasValidity] = useState(false)
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')

  // Step 3: Attributes & Images
  const [attributes, setAttributes] = useState<ProductAttribute[]>([])
  const [images, setImages] = useState<string[]>([])
  const [imageInput, setImageInput] = useState('')

  // Step 4: Prices
  const [priceLists, setPriceLists] = useState<PriceListDraft[]>([])
  const [discounts, setDiscounts] = useState<DiscountDraft[]>([])
  const [usesThirdParty, setUsesThirdParty] = useState(false)

  // Step 5: Payment
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash')
  const [maxQuotas, setMaxQuotas] = useState(1)
  const [interestRate, setInterestRate] = useState(0)

  // Step 6: Windows
  const [windows, setWindows] = useState<WindowDraft[]>([])

  // Navigation
  const handleNext = () => setStep((s) => Math.min(6, s + 1))
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
  const remImage = (url: string) => setImages((p) => p.filter((i) => i !== url))

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
    setWindows((p) => [
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
      },
    ])
  const updWindow = (id: string, field: string, value: string | number | boolean) =>
    setWindows((p) => p.map((w) => (w.id === id ? { ...w, [field]: value } : w)))
  const remWindow = (id: string) => setWindows((p) => p.filter((w) => w.id !== id))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setAlert(null)

    if (!sku.trim()) {
      setAlert({ type: 'error', message: 'El SKU es obligatorio.' })
      return
    }
    if (!name.trim()) {
      setAlert({ type: 'error', message: 'El nombre es obligatorio.' })
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
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        images,
        currentStock,
        minimumStock,
        hasValidity,
        validFrom: hasValidity ? validFrom : null,
        validTo: hasValidity ? validTo : null,
        attributes,
        priceLists: priceLists.map((p) => ({
          currency: p.currency,
          amount: p.amount,
          source: p.source,
          thirdPartyProvider: p.source === 'third-party' ? p.thirdPartyProvider : null,
          thirdPartyRef: p.source === 'third-party' ? p.thirdPartyRef : null,
          lastSyncAt: null,
        })),
        discounts: discounts.map((d) => ({
          startDate: d.startDate,
          endDate: d.endDate,
          percentage: d.percentage,
          description: d.description,
        })),
        paymentMode,
        maxQuotas,
        interestRate,
        usesThirdPartyPricing: usesThirdParty,
        windows: windows.map((w) => ({
          type: w.type,
          label: w.label,
          description: w.description,
          order: w.order,
          required: w.required,
          config: {
            redirectUrl: w.type === 'external-redirect' ? w.redirectUrl : undefined,
            paymentMethods:
              w.type === 'payment-form'
                ? w.paymentMethods
                    .split(',')
                    .map((m) => m.trim())
                    .filter(Boolean)
                : undefined,
            acceptedFileTypes:
              w.type === 'document-upload'
                ? w.acceptedFileTypes
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                : undefined,
            confirmationMessage:
              w.type === 'confirmation-dialog' ? w.confirmationMessage : undefined,
          },
        })),
        marketplaceId: null,
      }

      await productService.create(input)
      setAlert({ type: 'success', message: 'Producto creado exitosamente.' })
      setTimeout(() => router.push('/dashboard/products'), 1500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear producto.'
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
    name,
    setName,
    description,
    setDescription,
    type,
    setType,
    category,
    setCategory,
    tags,
    setTags,
    currentStock,
    setCurrentStock,
    minimumStock,
    setMinimumStock,
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
    paymentMode,
    setPaymentMode,
    maxQuotas,
    setMaxQuotas,
    interestRate,
    setInterestRate,
    windows,
    addWindow,
    updWindow,
    remWindow,
    handleNext,
    handleBack,
    handleSubmit,
  }
}
