export type ProductStep = 1 | 2 | 3 | 4 | 5 | 6

export interface ProductFormState {
  sku: string; name: string; description: string
  type: string; category: string; tags: string
  currentStock: number; minimumStock: number
  hasValidity: boolean; validityFrom: string; validityTo: string
  attributes: { id: string; name: string; value: string }[]
  images: string[]
  priceLists: { id: string; currency: string; amount: number }[]
  discountPeriods: { id: string; startDate: string; endDate: string; percentage: number; description: string }[]
  paymentType: string; initialPayment: number; maxQuotas: number; interestRate: number
  usesThirdParty: boolean
}

export interface ProductFormReturn {
  step: ProductStep; form: ProductFormState
  isLoading: boolean
  alert: { type: 'error' | 'success' | 'info'; message: string } | null
  contentRef: React.RefObject<HTMLDivElement | null>
  setAlert: (a: { type: 'error' | 'success' | 'info'; message: string } | null) => void
  updateField: (field: string, value: string | number | boolean) => void
  addAttribute: () => void; updateAttribute: (id: string, field: string, value: string) => void; removeAttribute: (id: string) => void
  addPriceList: () => void; updatePriceList: (id: string, field: string, value: string | number) => void; removePriceList: (id: string) => void
  addDiscount: () => void; updateDiscount: (id: string, field: string, value: string) => void; removeDiscount: (id: string) => void
  addImage: (url: string) => void; removeImage: (url: string) => void
  handleNext: () => void; handleBack: () => void; handleSubmit: (e: React.FormEvent) => void
}

export function useProductForm(): ProductFormReturn {
  const form: ProductFormState = { sku: '', name: '', description: '', type: 'PRODUCT', category: '', tags: '', currentStock: 0, minimumStock: 0, hasValidity: false, validityFrom: '', validityTo: '', attributes: [], images: [], priceLists: [], discountPeriods: [], paymentType: 'cash', initialPayment: 0, maxQuotas: 1, interestRate: 0, usesThirdParty: false }
  return {
    step: 1, form, isLoading: false, alert: null, contentRef: { current: null }, setAlert: () => {},
    updateField: () => {}, addAttribute: () => {}, updateAttribute: () => {}, removeAttribute: () => {},
    addPriceList: () => {}, updatePriceList: () => {}, removePriceList: () => {},
    addDiscount: () => {}, updateDiscount: () => {}, removeDiscount: () => {},
    addImage: () => {}, removeImage: () => {},
    handleNext: () => {}, handleBack: () => {}, handleSubmit: () => {},
  }
}
