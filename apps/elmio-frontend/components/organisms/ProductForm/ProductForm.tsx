'use client'

import { useState, useRef, type FormEvent } from 'react'
import { User, Box, ListChecks, DollarSign, CreditCard, Banknote } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { Alert } from '@/components/atoms/Alert/Alert'
import { StepIndicator } from '@/components/molecules/StepIndicator/StepIndicator'
import { FormField } from '@/components/molecules/FormField/FormField'

type ProductStep = 1 | 2 | 3 | 4 | 5 | 6

const stepDefs = [
  { id: 1, title: 'Basico', icon: User },
  { id: 2, title: 'Inventario', icon: Box },
  { id: 3, title: 'Atributos', icon: ListChecks },
  { id: 4, title: 'Precios', icon: DollarSign },
  { id: 5, title: 'Pago', icon: CreditCard },
  { id: 6, title: 'Metodos', icon: Banknote },
]

interface PriceList { id: string; currency: string; amount: number }
interface DiscountPeriod { id: string; startDate: string; endDate: string; percentage: number; description: string }
interface ProductAttribute { id: string; name: string; value: string }

export function ProductForm() {
  const [step, setStep] = useState<ProductStep>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('PRODUCT')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [currentStock, setCurrentStock] = useState(0)
  const [minimumStock, setMinimumStock] = useState(0)
  const [hasValidity, setHasValidity] = useState(false)
  const [validityFrom, setValidityFrom] = useState('')
  const [validityTo, setValidityTo] = useState('')
  const [attributes, setAttributes] = useState<ProductAttribute[]>([])
  const [images, setImages] = useState<string[]>([])
  const [imageInput, setImageInput] = useState('')
  const [priceLists, setPriceLists] = useState<PriceList[]>([])
  const [discounts, setDiscounts] = useState<DiscountPeriod[]>([])
  const [paymentType, setPaymentType] = useState('cash')
  const [maxQuotas, setMaxQuotas] = useState(1)
  const [interestRate, setInterestRate] = useState(0)
  const [usesThirdParty, setUsesThirdParty] = useState(false)

  const completedSteps = Array.from({ length: step - 1 }, (_, i) => i + 1)

  const handleNext = () => setStep((s) => Math.min(6, s + 1) as ProductStep)
  const handleBack = () => setStep((s) => Math.max(1, s - 1) as ProductStep)

  const addAttribute = () => setAttributes((p) => [...p, { id: crypto.randomUUID(), name: '', value: '' }])
  const updAttribute = (id: string, f: string, v: string) => setAttributes((p) => p.map((a) => a.id === id ? { ...a, [f]: v } : a))
  const remAttribute = (id: string) => setAttributes((p) => p.filter((a) => a.id !== id))

  const addPrice = () => setPriceLists((p) => [...p, { id: crypto.randomUUID(), currency: 'USD', amount: 0 }])
  const updPrice = (id: string, f: string, v: string | number) => setPriceLists((p) => p.map((l) => l.id === id ? { ...l, [f]: v } : l))
  const remPrice = (id: string) => setPriceLists((p) => p.filter((l) => l.id !== id))

  const addDiscount = () => setDiscounts((p) => [...p, { id: crypto.randomUUID(), startDate: '', endDate: '', percentage: 0, description: '' }])
  const updDiscount = (id: string, f: string, v: string) => setDiscounts((p) => p.map((d) => d.id === id ? { ...d, [f]: v } : d))
  const remDiscount = (id: string) => setDiscounts((p) => p.filter((d) => d.id !== id))

  const addImage = () => { if (imageInput.trim()) { setImages((p) => [...p, imageInput.trim()]); setImageInput('') } }
  const remImage = (url: string) => setImages((p) => p.filter((i) => i !== url))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setAlert({ type: 'success', message: 'Producto creado (simulacion). El backend persistira los datos cuando este conectado.' })
      setTimeout(() => setAlert(null), 4000)
    }, 800)
  }

  return (
    <div className="w-full">
      <StepIndicator steps={stepDefs} currentStep={step} completedSteps={completedSteps} stepIcons={stepDefs.map((s) => s.icon)} onStepClick={() => {}} />

      {alert && <div className="mb-5"><Alert type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} /></div>}

      <form onSubmit={handleSubmit}>
        <div ref={contentRef} className="flex flex-col gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="SKU" required><Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="PROD-001" /></FormField>
                <FormField label="Tipo" required>
                  <Select value={type} onChange={setType} options={[{ value: 'PRODUCT', label: 'Producto' }, { value: 'SERVICE', label: 'Servicio' }, { value: 'KIT', label: 'Kit' }, { value: 'LOAN', label: 'Prestamo' }]} />
                </FormField>
              </div>
              <FormField label="Nombre" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del producto" /></FormField>
              <FormField label="Descripcion"><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripcion del producto" /></FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Categoria"><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej: Seguros" /></FormField>
                <FormField label="Etiquetas"><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="nuevo, destacado (separado por comas)" /></FormField>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Stock actual"><Input type="number" value={String(currentStock)} onChange={(e) => setCurrentStock(Number(e.target.value))} /></FormField>
                <FormField label="Stock minimo"><Input type="number" value={String(minimumStock)} onChange={(e) => setMinimumStock(Number(e.target.value))} /></FormField>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-body-secondary">Tiene vigencia?</label>
                <button type="button" role="switch" aria-checked={hasValidity} onClick={() => setHasValidity(!hasValidity)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasValidity ? 'bg-secondary' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${hasValidity ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {hasValidity && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Valido desde"><Input type="date" value={validityFrom} onChange={(e) => setValidityFrom(e.target.value)} /></FormField>
                  <FormField label="Valido hasta"><Input type="date" value={validityTo} onChange={(e) => setValidityTo(e.target.value)} /></FormField>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-body-secondary">Atributos ({attributes.length})</span>
                <button type="button" onClick={addAttribute} className="text-xs text-secondary font-medium">+ Agregar</button>
              </div>
              {attributes.map((a) => (
                <div key={a.id} className="grid grid-cols-2 gap-2 items-center">
                  <Input value={a.name} onChange={(e) => updAttribute(a.id, 'name', e.target.value)} placeholder="Nombre (ej: Color)" />
                  <div className="flex gap-2">
                    <Input value={a.value} onChange={(e) => updAttribute(a.id, 'value', e.target.value)} placeholder="Valor (ej: Rojo)" />
                    <button type="button" onClick={() => remAttribute(a.id)} className="text-gray-400 hover:text-red-500">✕</button>
                  </div>
                </div>
              ))}

              <div className="border-t border-gray-100 pt-4 mt-2">
                <span className="text-sm font-medium text-body-secondary mb-2 block">Imagenes ({images.length})</span>
                <div className="flex gap-2 mb-3">
                  <Input value={imageInput} onChange={(e) => setImageInput(e.target.value)} placeholder="URL de imagen" />
                  <Button type="button" variant="ghost" onClick={addImage} className="text-xs whitespace-nowrap">Agregar</Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {images.map((url) => (
                    <div key={url} className="relative group rounded-lg border border-gray-200 overflow-hidden aspect-square bg-gray-50 flex items-center justify-center">
                      <span className="text-[10px] text-gray-400 truncate px-1">{url.split('/').pop()}</span>
                      <button type="button" onClick={() => remImage(url)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-body-secondary">Listas de precio ({priceLists.length})</span>
                <button type="button" onClick={addPrice} className="text-xs text-secondary font-medium">+ Agregar</button>
              </div>
              {priceLists.map((p) => (
                <div key={p.id} className="grid grid-cols-3 gap-2 items-center">
                  <Select value={p.currency} onChange={(v) => updPrice(p.id, 'currency', v)} options={[{ value: 'USD', label: 'USD' }, { value: 'VES', label: 'VES' }, { value: 'EUR', label: 'EUR' }]} />
                  <Input type="number" value={String(p.amount)} onChange={(e) => updPrice(p.id, 'amount', Number(e.target.value))} placeholder="Monto" />
                  <button type="button" onClick={() => remPrice(p.id)} className="text-gray-400 hover:text-red-500">✕</button>
                </div>
              ))}

              <div className="border-t border-gray-100 pt-4 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-body-secondary">Descuentos ({discounts.length})</span>
                  <button type="button" onClick={addDiscount} className="text-xs text-secondary font-medium">+ Agregar</button>
                </div>
                {discounts.map((d) => (
                  <div key={d.id} className="grid grid-cols-2 gap-2 mb-3 p-3 border border-gray-100 rounded-xl">
                    <Input value={d.startDate} onChange={(e) => updDiscount(d.id, 'startDate', e.target.value)} placeholder="Inicio (YYYY-MM-DD)" />
                    <Input value={d.endDate} onChange={(e) => updDiscount(d.id, 'endDate', e.target.value)} placeholder="Fin (YYYY-MM-DD)" />
                    <Input type="number" value={String(d.percentage)} onChange={(e) => updDiscount(d.id, 'percentage', e.target.value)} placeholder="% Descuento" />
                    <div className="flex items-center gap-2">
                      <Input value={d.description} onChange={(e) => updDiscount(d.id, 'description', e.target.value)} placeholder="Descripcion" />
                      <button type="button" onClick={() => remDiscount(d.id)} className="text-gray-400 hover:text-red-500">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-4">
              <FormField label="Tipo de pago" required>
                <Select value={paymentType} onChange={setPaymentType} options={[
                  { value: 'cash', label: 'Contado' }, { value: 'quota', label: 'Cuotas' }, { value: 'mixed', label: 'Mixto' },
                ]} />
              </FormField>
              {paymentType !== 'cash' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Cuotas maximas"><Input type="number" value={String(maxQuotas)} onChange={(e) => setMaxQuotas(Number(e.target.value))} min={1} /></FormField>
                  <FormField label="Tasa de interes (%)"><Input type="number" value={String(interestRate)} onChange={(e) => setInterestRate(Number(e.target.value))} min={0} /></FormField>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <label className="text-sm text-body-secondary">Usa servicio de terceros para pagos?</label>
                <button type="button" role="switch" aria-checked={usesThirdParty} onClick={() => setUsesThirdParty(!usesThirdParty)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${usesThirdParty ? 'bg-secondary' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${usesThirdParty ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4 border-t border-gray-100 pt-4">
            {step > 1 && <Button type="button" variant="ghost" fullWidth onClick={handleBack}>Anterior</Button>}
            {step < 6 ? (
              <Button type="button" fullWidth onClick={handleNext}>Siguiente</Button>
            ) : (
              <Button type="submit" fullWidth isLoading={isLoading}>{isLoading ? 'Creando...' : 'Crear producto'}</Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
