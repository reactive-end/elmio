'use client'

import { useMemo } from 'react'
import { User, Box, ListChecks, DollarSign, CreditCard, Layers } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { Alert } from '@/components/atoms/Alert/Alert'
import { StepIndicator } from '@/components/molecules/StepIndicator/StepIndicator'
import { FormField } from '@/components/molecules/FormField/FormField'
import { useProductForm } from './useProductForm'

const stepDefs = [
  { id: 1, title: 'Basico', icon: User },
  { id: 2, title: 'Inventario', icon: Box },
  { id: 3, title: 'Atributos', icon: ListChecks },
  { id: 4, title: 'Precios', icon: DollarSign },
  { id: 5, title: 'Pago', icon: CreditCard },
  { id: 6, title: 'Acciones', icon: Layers },
]

const WINDOW_TYPES = [
  { value: 'payment-form', label: 'Formulario de pago' },
  { value: 'custom-form', label: 'Formulario personalizado' },
  { value: 'external-redirect', label: 'Redireccion externa' },
  { value: 'document-upload', label: 'Subir documento' },
  { value: 'confirmation-dialog', label: 'Confirmacion' },
]

export function ProductForm() {
  const f = useProductForm()
  const completedSteps = useMemo(
    () => Array.from({ length: f.step - 1 }, (_, i) => i + 1),
    [f.step],
  )

  return (
    <div className="w-full">
      <StepIndicator
        steps={stepDefs}
        currentStep={f.step}
        completedSteps={completedSteps}
        stepIcons={stepDefs.map((s) => s.icon)}
        onStepClick={() => {}}
      />

      {f.alert && (
        <div className="mb-5">
          <Alert type={f.alert.type} message={f.alert.message} onDismiss={() => f.setAlert(null)} />
        </div>
      )}

      <form onSubmit={(e) => void f.handleSubmit(e)}>
        <div className="flex flex-col gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Step 1: Basic */}
          {f.step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="SKU" required>
                  <Input
                    value={f.sku}
                    onChange={(e) => f.setSku(e.target.value)}
                    placeholder="PROD-001"
                  />
                </FormField>
                <FormField label="Tipo" required>
                  <Select
                    value={f.type}
                    onChange={(v) => f.setType(v as typeof f.type)}
                    options={[
                      { value: 'PRODUCT', label: 'Producto' },
                      { value: 'SERVICE', label: 'Servicio' },
                      { value: 'KIT', label: 'Kit' },
                      { value: 'LOAN', label: 'Prestamo' },
                    ]}
                  />
                </FormField>
              </div>
              <FormField label="Nombre" required>
                <Input
                  value={f.name}
                  onChange={(e) => f.setName(e.target.value)}
                  placeholder="Nombre del producto"
                />
              </FormField>
              <FormField label="Descripcion">
                <Input
                  value={f.description}
                  onChange={(e) => f.setDescription(e.target.value)}
                  placeholder="Descripcion del producto"
                />
              </FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Categoria">
                  <Input
                    value={f.category}
                    onChange={(e) => f.setCategory(e.target.value)}
                    placeholder="Ej: Seguros"
                  />
                </FormField>
                <FormField label="Etiquetas">
                  <Input
                    value={f.tags}
                    onChange={(e) => f.setTags(e.target.value)}
                    placeholder="nuevo, destacado (comas)"
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Step 2: Inventory */}
          {f.step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Stock actual">
                  <Input
                    type="number"
                    value={String(f.currentStock)}
                    onChange={(e) => f.setCurrentStock(Number(e.target.value))}
                  />
                </FormField>
                <FormField label="Stock minimo">
                  <Input
                    type="number"
                    value={String(f.minimumStock)}
                    onChange={(e) => f.setMinimumStock(Number(e.target.value))}
                  />
                </FormField>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-body-secondary">Tiene vigencia?</label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={f.hasValidity}
                  onClick={() => f.setHasValidity(!f.hasValidity)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${f.hasValidity ? 'bg-secondary' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${f.hasValidity ? 'translate-x-5' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
              {f.hasValidity && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Valido desde">
                    <Input
                      type="date"
                      value={f.validFrom}
                      onChange={(e) => f.setValidFrom(e.target.value)}
                    />
                  </FormField>
                  <FormField label="Valido hasta">
                    <Input
                      type="date"
                      value={f.validTo}
                      onChange={(e) => f.setValidTo(e.target.value)}
                    />
                  </FormField>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Attributes & Images */}
          {f.step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-body-secondary">
                  Atributos ({f.attributes.length})
                </span>
                <button
                  type="button"
                  onClick={f.addAttribute}
                  className="text-xs text-secondary font-medium"
                >
                  + Agregar
                </button>
              </div>
              {f.attributes.map((a) => (
                <div key={a.id} className="grid grid-cols-2 gap-2 items-center">
                  <Input
                    value={a.name}
                    onChange={(e) => f.updAttribute(a.id, 'name', e.target.value)}
                    placeholder="Nombre (ej: Color)"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={a.value}
                      onChange={(e) => f.updAttribute(a.id, 'value', e.target.value)}
                      placeholder="Valor (ej: Rojo)"
                    />
                    <button
                      type="button"
                      onClick={() => f.remAttribute(a.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-4 mt-2">
                <span className="text-sm font-medium text-body-secondary mb-2 block">
                  Imagenes ({f.images.length})
                </span>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={f.imageInput}
                    onChange={(e) => f.setImageInput(e.target.value)}
                    placeholder="URL de imagen"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={f.addImage}
                    className="text-xs whitespace-nowrap"
                  >
                    Agregar
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {f.images.map((url) => (
                    <div
                      key={url}
                      className="relative group rounded-lg border border-gray-200 overflow-hidden aspect-square bg-gray-50 flex items-center justify-center"
                    >
                      <span className="text-[10px] text-gray-400 truncate px-1">
                        {url.split('/').pop()}
                      </span>
                      <button
                        type="button"
                        onClick={() => f.remImage(url)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Prices */}
          {f.step === 4 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-body-secondary">
                  Listas de precio ({f.priceLists.length})
                </span>
                <button
                  type="button"
                  onClick={f.addPrice}
                  className="text-xs text-secondary font-medium"
                >
                  + Agregar
                </button>
              </div>
              {f.priceLists.map((p) => (
                <div
                  key={p.id}
                  className="p-3 border border-gray-100 rounded-xl flex flex-col gap-2"
                >
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Select
                      value={p.currency}
                      onChange={(v) => f.updPrice(p.id, 'currency', v)}
                      options={[
                        { value: 'USD', label: 'USD' },
                        { value: 'VES', label: 'VES' },
                        { value: 'EUR', label: 'EUR' },
                      ]}
                    />
                    <Input
                      type="number"
                      value={String(p.amount)}
                      onChange={(e) => f.updPrice(p.id, 'amount', Number(e.target.value))}
                      placeholder="Monto"
                    />
                    <div className="flex items-center gap-2">
                      <Select
                        value={p.source}
                        onChange={(v) => f.updPrice(p.id, 'source', v)}
                        options={[
                          { value: 'manual', label: 'Manual' },
                          { value: 'third-party', label: 'Tercero' },
                        ]}
                      />
                      <button
                        type="button"
                        onClick={() => f.remPrice(p.id)}
                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {p.source === 'third-party' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={p.thirdPartyProvider}
                        onChange={(e) => f.updPrice(p.id, 'thirdPartyProvider', e.target.value)}
                        placeholder="Proveedor (ej: Mercantil)"
                      />
                      <Input
                        value={p.thirdPartyRef}
                        onChange={(e) => f.updPrice(p.id, 'thirdPartyRef', e.target.value)}
                        placeholder="Referencia / API ID"
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="border-t border-gray-100 pt-4 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-body-secondary">
                    Descuentos ({f.discounts.length})
                  </span>
                  <button
                    type="button"
                    onClick={f.addDiscount}
                    className="text-xs text-secondary font-medium"
                  >
                    + Agregar
                  </button>
                </div>
                {f.discounts.map((d) => (
                  <div
                    key={d.id}
                    className="grid grid-cols-2 gap-2 mb-3 p-3 border border-gray-100 rounded-xl"
                  >
                    <Input
                      type="date"
                      value={d.startDate}
                      onChange={(e) => f.updDiscount(d.id, 'startDate', e.target.value)}
                    />
                    <Input
                      type="date"
                      value={d.endDate}
                      onChange={(e) => f.updDiscount(d.id, 'endDate', e.target.value)}
                    />
                    <Input
                      type="number"
                      value={String(d.percentage)}
                      onChange={(e) => f.updDiscount(d.id, 'percentage', Number(e.target.value))}
                      placeholder="% Descuento"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        value={d.description}
                        onChange={(e) => f.updDiscount(d.id, 'description', e.target.value)}
                        placeholder="Descripcion"
                      />
                      <button
                        type="button"
                        onClick={() => f.remDiscount(d.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                <label className="text-sm text-body-secondary">Precios de terceros?</label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={f.usesThirdParty}
                  onClick={() => f.setUsesThirdParty(!f.usesThirdParty)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${f.usesThirdParty ? 'bg-secondary' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${f.usesThirdParty ? 'translate-x-5' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
              {f.usesThirdParty && (
                <p className="text-xs text-body-muted bg-blue-50 rounded-lg px-3 py-2">
                  Los precios de terceros se sincronizan automaticamente. Configura el proveedor y
                  la referencia en cada lista de precio con fuente &quot;Tercero&quot;. Esto puede
                  afectar las cuotas disponibles.
                </p>
              )}
            </div>
          )}

          {/* Step 5: Payment */}
          {f.step === 5 && (
            <div className="flex flex-col gap-4">
              <FormField label="Modalidad de pago" required>
                <Select
                  value={f.paymentMode}
                  onChange={(v) => f.setPaymentMode(v as typeof f.paymentMode)}
                  options={[
                    { value: 'cash', label: 'Contado' },
                    { value: 'quota', label: 'Cuotas' },
                    { value: 'mixed', label: 'Mixto' },
                  ]}
                />
              </FormField>
              {f.paymentMode !== 'cash' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Cuotas maximas">
                    <Input
                      type="number"
                      value={String(f.maxQuotas)}
                      onChange={(e) => f.setMaxQuotas(Number(e.target.value))}
                      min={1}
                    />
                  </FormField>
                  <FormField label="Tasa de interes (%)">
                    <Input
                      type="number"
                      value={String(f.interestRate)}
                      onChange={(e) => f.setInterestRate(Number(e.target.value))}
                      min={0}
                      step={0.01}
                    />
                  </FormField>
                </div>
              )}
              {f.usesThirdParty && f.paymentMode !== 'cash' && (
                <p className="text-xs text-body-muted bg-amber-50 rounded-lg px-3 py-2">
                  Cuando se usa precio de terceros, las cuotas se calculan sobre el monto
                  sincronizado. Si el tercero actualiza el precio, las cuotas se recalculan
                  automaticamente.
                </p>
              )}
            </div>
          )}

          {/* Step 6: Windows/Actions */}
          {f.step === 6 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-body-secondary">
                    Ventanas / Acciones ({f.windows.length})
                  </span>
                  <p className="text-xs text-body-muted mt-0.5">
                    Agrega procesos que se ejecutan al adquirir este producto: pagos, formularios,
                    redirecciones, etc.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={f.addWindow}
                  className="text-xs text-secondary font-medium whitespace-nowrap"
                >
                  + Agregar ventana
                </button>
              </div>

              {f.windows.map((w) => (
                <div
                  key={w.id}
                  className="p-4 border border-gray-100 rounded-xl flex flex-col gap-3 bg-gray-50/50"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Tipo de ventana">
                      <Select
                        value={w.type}
                        onChange={(v) => f.updWindow(w.id, 'type', v)}
                        options={WINDOW_TYPES}
                      />
                    </FormField>
                    <FormField label="Etiqueta">
                      <Input
                        value={w.label}
                        onChange={(e) => f.updWindow(w.id, 'label', e.target.value)}
                        placeholder="Ej: Pagar cuota"
                      />
                    </FormField>
                  </div>
                  <FormField label="Descripcion">
                    <Input
                      value={w.description}
                      onChange={(e) => f.updWindow(w.id, 'description', e.target.value)}
                      placeholder="Describe lo que hace esta ventana"
                    />
                  </FormField>

                  {/* Type-specific config */}
                  {w.type === 'external-redirect' && (
                    <FormField label="URL de redireccion">
                      <Input
                        value={w.redirectUrl}
                        onChange={(e) => f.updWindow(w.id, 'redirectUrl', e.target.value)}
                        placeholder="https://ejemplo.com/pago"
                      />
                    </FormField>
                  )}
                  {w.type === 'payment-form' && (
                    <FormField label="Metodos de pago (comas)">
                      <Input
                        value={w.paymentMethods}
                        onChange={(e) => f.updWindow(w.id, 'paymentMethods', e.target.value)}
                        placeholder="debito-inmediato, pago-movil, transferencia"
                      />
                    </FormField>
                  )}
                  {w.type === 'document-upload' && (
                    <FormField label="Tipos de archivo (comas)">
                      <Input
                        value={w.acceptedFileTypes}
                        onChange={(e) => f.updWindow(w.id, 'acceptedFileTypes', e.target.value)}
                        placeholder=".pdf, .jpg, .png"
                      />
                    </FormField>
                  )}
                  {w.type === 'confirmation-dialog' && (
                    <FormField label="Mensaje de confirmacion">
                      <Input
                        value={w.confirmationMessage}
                        onChange={(e) => f.updWindow(w.id, 'confirmationMessage', e.target.value)}
                        placeholder="Confirma que deseas proceder..."
                      />
                    </FormField>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={w.required}
                        onChange={(e) => f.updWindow(w.id, 'required', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                      />
                      <span className="text-xs text-body-muted">Obligatorio</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => f.remWindow(w.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {f.windows.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Layers className="w-10 h-10 mx-auto mb-2 opacity-40" strokeWidth={1.5} />
                  <p className="text-sm">Sin ventanas configuradas.</p>
                  <p className="text-xs mt-0.5">
                    Los productos pueden tener formularios de pago, procesos personalizados, etc.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-4 border-t border-gray-100 pt-4">
            {f.step > 1 && (
              <Button type="button" variant="ghost" fullWidth onClick={f.handleBack}>
                Anterior
              </Button>
            )}
            {f.step < 6 ? (
              <Button type="button" fullWidth onClick={f.handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button type="submit" fullWidth isLoading={f.isLoading}>
                {f.isLoading ? 'Creando...' : 'Crear producto'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
