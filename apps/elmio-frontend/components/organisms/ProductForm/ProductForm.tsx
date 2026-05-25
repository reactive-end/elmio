'use client'

import { useMemo } from 'react'
import { User, Box, ListChecks, DollarSign, Layers, Sparkles } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { Alert } from '@/components/atoms/Alert/Alert'
import { StepIndicator } from '@/components/molecules/StepIndicator/StepIndicator'
import { FormField } from '@/components/molecules/FormField/FormField'
import { SearchableSelect } from '@/components/molecules/SearchableSelect/SearchableSelect'
import { ImagePicker } from '@/components/molecules/ImagePicker/ImagePicker'
import { useProductForm } from './useProductForm'

const stepDefs = [
  { id: 1, title: 'Basico', icon: User },
  { id: 2, title: 'Inventario', icon: Box },
  { id: 3, title: 'Atributos', icon: ListChecks },
  { id: 4, title: 'Precios y Pago', icon: DollarSign },
  { id: 5, title: 'Acciones', icon: Layers },
]

const WINDOW_TYPES = [
  { value: 'payment-form', label: 'Formulario de pago' },
  { value: 'custom-form', label: 'Formulario personalizado' },
  { value: 'external-redirect', label: 'Redireccion externa' },
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
                  <div className="relative flex items-center w-full">
                    <Input
                      value={f.sku}
                      onChange={(e) => f.setSku(e.target.value)}
                      placeholder="PROD-001"
                      className="pr-12 w-full"
                    />
                    <button
                      type="button"
                      onClick={f.generateRandomSku}
                      className="absolute right-[2px] top-[2px] bottom-[2px] px-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-[10px] border-l border-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                      title="Generar SKU aleatorio"
                    >
                      <Sparkles className="w-4 h-4 text-secondary" strokeWidth={1.5} />
                    </button>
                  </div>
                </FormField>
                <FormField label="Tipo" required>
                  <Select
                    value={f.type}
                    onChange={(v) => f.setType(v as typeof f.type)}
                    options={[
                      { value: 'PRODUCT', label: 'Producto' },
                      { value: 'SERVICE', label: 'Servicio' },
                      { value: 'KIT', label: 'Kit' },
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
                <FormField label="Categoría">
                  <SearchableSelect
                    value={f.category}
                    onChange={(v) => f.setCategory(v)}
                    placeholder={
                      f.categories.length === 0
                        ? 'Sin categorías activas'
                        : 'Selecciona una categoría'
                    }
                    options={f.categories.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                  />
                </FormField>
                <FormField label="Etiquetas">
                  <div className="flex flex-col gap-2">
                    <Input
                      value={f.tagInput}
                      onChange={(e) => f.setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          f.addTag()
                        }
                      }}
                      placeholder="Escribe y presiona Enter"
                    />
                    {f.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {f.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 bg-secondary/10 hover:bg-secondary/15 text-secondary text-xs font-medium px-3 py-1 rounded-full transition-colors"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => f.remTag(tag)}
                              className="text-secondary/60 hover:text-secondary focus:outline-none cursor-pointer text-[10px] font-bold"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </FormField>
              </div>
            </div>
          )}

          {/* Step 2: Inventory */}
          {f.step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-gray-50/50 rounded-xl p-3 border border-gray-100/50 mb-1">
                <label className="text-sm font-medium text-body-secondary flex-1">
                  Maneja stock o inventario?
                  <span className="block text-xs text-gray-400 font-normal mt-0.5">
                    Desactivalo si es un servicio, seguro o prestamo.
                  </span>
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={f.hasStock}
                  onClick={() => {
                    const nextVal = !f.hasStock
                    f.setHasStock(nextVal)
                    if (!nextVal) {
                      f.setCurrentStock(0)
                      f.setMinimumStock(0)
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    f.hasStock ? 'bg-secondary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      f.hasStock ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {f.hasStock && (
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
              )}

              <div className="flex items-center gap-3 bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
                <label className="text-sm font-medium text-body-secondary flex-1">
                  Tiene vigencia?
                  <span className="block text-xs text-gray-400 font-normal mt-0.5">
                    Define un periodo de validez para el producto.
                  </span>
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={f.hasValidity}
                  onClick={() => f.setHasValidity(!f.hasValidity)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${f.hasValidity ? 'bg-secondary' : 'bg-gray-200'}`}
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
                <div className="mb-4">
                  <ImagePicker
                    label="Seleccionar imagen de la galeria"
                    value=""
                    onChange={(url) => {
                      if (url) f.addImageFromGallery(url)
                    }}
                  />
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

          {/* Step 4: Prices & Payment */}
          {f.step === 4 && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="text-sm font-medium text-body-secondary block">Precios</span>
                    <p className="text-xs text-body-muted mt-1">
                      Define si el producto usara listas manuales o un proveedor externo.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:shrink-0">
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
                </div>

                {!f.usesThirdParty ? (
                  <>
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
                        className="p-3 border border-gray-100 rounded-xl flex flex-col gap-2 bg-white"
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
                              onChange={(e) =>
                                f.updPrice(p.id, 'thirdPartyProvider', e.target.value)
                              }
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
                          className="grid grid-cols-2 gap-2 mb-3 p-3 border border-gray-100 rounded-xl bg-white"
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
                            onChange={(e) =>
                              f.updDiscount(d.id, 'percentage', Number(e.target.value))
                            }
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
                  </>
                ) : (
                  <div className="flex flex-col gap-4 p-4 border border-gray-100 rounded-2xl bg-white">
                    <FormField label="Proveedor de precios de terceros" required>
                      <Select
                        value={f.globalThirdPartyProvider}
                        onChange={(v) => f.setGlobalThirdPartyProvider(v)}
                        options={[
                          { value: 'elmio:mercantil-vida', label: 'Mercantil Vida Vital' },
                          {
                            value: 'elmio:mercantil-accidentes',
                            label: 'Mercantil Accidentes Personales',
                          },
                          {
                            value: 'elmio:mercantil-funeraria',
                            label: 'Mercantil Servicios Funerarios',
                          },
                        ]}
                        placeholder="Selecciona un proveedor de terceros"
                      />
                    </FormField>
                    {f.isThirdPartyProviderPending && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        Selecciona un proveedor para definir como se obtendran precios y modalidades
                        de pago.
                      </p>
                    )}
                    <p className="text-xs text-body-muted bg-blue-50 rounded-lg px-3 py-2">
                      Los precios de terceros se sincronizan automaticamente desde la integracion
                      seleccionada.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-4">
                <div>
                  <span className="text-sm font-medium text-body-secondary block">Pago</span>
                  <p className="text-xs text-body-muted mt-1">
                    Configura el esquema comercial del producto cuando el precio se gestione
                    manualmente.
                  </p>
                </div>

                {f.isThirdPartyProviderPending ? (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-body-secondary">
                    Selecciona primero un proveedor externo para determinar si la configuracion de
                    pago se administra desde esta pantalla o desde la integracion.
                  </div>
                ) : f.usesProviderManagedPayment ? (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-body-secondary">
                    Este proveedor ya define las modalidades y frecuencias de pago dentro de su
                    propia API. No necesitas configurar cuotas ni financiamiento manualmente.
                  </div>
                ) : (
                  <>
                    <FormField label="Modalidad de pago" required>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { value: 'cash', label: 'Contado', desc: 'Pago unico inmediato.' },
                          { value: 'quota', label: 'Cuotas', desc: 'Financiamiento periodico.' },
                          { value: 'mixed', label: 'Mixto', desc: 'Pago inicial + cuotas.' },
                        ].map((mode) => {
                          const isSel = f.paymentMode === mode.value
                          return (
                            <button
                              key={mode.value}
                              type="button"
                              onClick={() => f.setPaymentMode(mode.value as typeof f.paymentMode)}
                              className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all duration-200 cursor-pointer ${
                                isSel
                                  ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <span
                                className={`text-sm font-semibold ${isSel ? 'text-secondary' : 'text-body'}`}
                              >
                                {mode.label}
                              </span>
                              <span className="text-xs text-gray-400 font-normal">{mode.desc}</span>
                            </button>
                          )
                        })}
                      </div>
                    </FormField>

                    {f.paymentMode !== 'cash' && (
                      <div className="flex flex-col gap-4 border border-gray-100 bg-gray-50/30 rounded-2xl p-5 mt-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                          Configuracion de Financiamiento
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <FormField label="Frecuencia / Periodo">
                            <Select
                              value={f.paymentPeriod || 'monthly'}
                              onChange={(v) => f.setPaymentPeriod(v)}
                              options={[
                                { value: 'daily', label: 'Diario' },
                                { value: 'biweekly', label: 'Quincenal' },
                                { value: 'monthly', label: 'Mensual' },
                                { value: 'quarterly', label: 'Trimestral' },
                                { value: 'semiannually', label: 'Semestral' },
                                { value: 'annually', label: 'Anual' },
                              ]}
                            />
                          </FormField>
                          <FormField label="Cuotas maximas">
                            <Input
                              type="number"
                              value={String(f.maxQuotas)}
                              onChange={(e) => f.setMaxQuotas(Number(e.target.value))}
                              min={1}
                            />
                          </FormField>
                          <FormField label="Pago inicial (Cuota inicial)">
                            <Input
                              type="number"
                              value={String(f.initialPayment)}
                              onChange={(e) => f.setInitialPayment(Number(e.target.value))}
                              min={0}
                              placeholder="Ej: 50"
                            />
                          </FormField>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100/70 pt-4 mt-1">
                          <FormField label="Tipo de interes">
                            <Select
                              value={f.interestType}
                              onChange={(v) => f.setInterestType(v as typeof f.interestType)}
                              options={[
                                { value: 'none', label: 'Sin interes' },
                                { value: 'percentage', label: 'Porcentual (%)' },
                                { value: 'fixed', label: 'Monto fijo' },
                              ]}
                            />
                          </FormField>
                          {f.interestType !== 'none' && (
                            <FormField
                              label={
                                f.interestType === 'percentage'
                                  ? 'Tasa de interes (%)'
                                  : 'Monto de interes'
                              }
                            >
                              <Input
                                type="number"
                                value={String(f.interestRate)}
                                onChange={(e) => f.setInterestRate(Number(e.target.value))}
                                min={0}
                                step={0.01}
                              />
                            </FormField>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {f.usesThirdParty &&
                !f.usesProviderManagedPayment &&
                !f.isThirdPartyProviderPending && (
                  <p className="text-xs text-body-muted bg-blue-50 rounded-lg px-3 py-2">
                    Los precios de terceros se sincronizan automaticamente. Configura el proveedor y
                    la referencia en cada lista de precio con fuente &quot;Tercero&quot;. Esto puede
                    afectar las cuotas disponibles.
                  </p>
                )}

              {f.usesThirdParty &&
                !f.usesProviderManagedPayment &&
                !f.isThirdPartyProviderPending &&
                f.paymentMode !== 'cash' && (
                  <p className="text-xs text-body-muted bg-amber-50 rounded-lg px-3 py-2">
                    Cuando se usa precio de terceros, las cuotas se calculan sobre el monto
                    sincronizado. Si el tercero actualiza el precio, las cuotas se recalculan
                    automaticamente.
                  </p>
                )}
            </div>
          )}

          {/* Step 5: Windows/Actions */}
          {f.step === 5 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-body-secondary">
                    Ventana / Accion ({f.windows.length}/1)
                  </span>
                  <p className="text-xs text-body-muted mt-0.5">
                    Configura una sola accion para la compra: pago, consulta Mercantil o
                    redireccion externa.
                  </p>
                </div>
                {f.windows.length === 0 && (
                  <button
                    type="button"
                    onClick={f.addWindow}
                    className="text-xs text-secondary font-medium whitespace-nowrap"
                  >
                    + Agregar accion
                  </button>
                )}
              </div>

              {f.windows.map((w) => (
                <div
                  key={w.id}
                  className="p-4 border border-gray-100 rounded-xl flex flex-col gap-4 bg-gray-50/50 relative"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Tipo de ventana">
                      <Select
                        value={w.type}
                        onChange={(v) => {
                          f.updWindow(w.id, 'type', v)
                          const defaultKey =
                            v === 'payment-form'
                              ? 'pay-cash'
                              : v === 'custom-form'
                                ? 'mercantil-query-form'
                                : ''
                          f.updWindow(w.id, 'actionKey', defaultKey)
                        }}
                        options={WINDOW_TYPES}
                      />
                    </FormField>

                    {w.type === 'external-redirect' ? (
                      <FormField label="URL de redireccion externa">
                        <Input
                          value={w.actionKey || ''}
                          onChange={(e) => f.updWindow(w.id, 'actionKey', e.target.value)}
                          placeholder="https://ejemplo.com/pago"
                        />
                      </FormField>
                    ) : (
                      <FormField label="Accion / Funcion a ejecutar">
                        <Select
                          value={w.type === 'payment-form' ? '' : (w.actionKey || 'mercantil-query-form')}
                          onChange={(v) => f.updWindow(w.id, 'actionKey', v)}
                          disabled={w.type === 'payment-form'}
                          placeholder={w.type === 'payment-form' ? 'Proximamente' : 'Seleccione accion'}
                          options={
                            w.type === 'payment-form'
                              ? []
                              : [
                                  {
                                    value: 'mercantil-query-form',
                                    label: 'Consulta de clientes Mercantil (mercantil/consulta)',
                                  },
                                ]
                          }
                        />
                      </FormField>
                    )}
                  </div>

                  <div className="flex items-center justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => f.remWindow(w.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                    >
                      Eliminar accion
                    </button>
                  </div>

                  {w.type === 'custom-form' && (
                    <p className="text-xs text-body-muted bg-blue-50 rounded-lg px-3 py-2">
                      Esta accion abrira la consulta de Mercantil dentro de la compra para que la
                      empresa complete el proceso sin salir del marketplace.
                    </p>
                  )}
                </div>
              ))}

              {f.windows.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Layers className="w-10 h-10 mx-auto mb-2 opacity-40" strokeWidth={1.5} />
                  <p className="text-sm">Sin accion configurada.</p>
                  <p className="text-xs mt-0.5">
                    El producto puede usar una sola accion de pago, consulta o redireccion.
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
            {f.step < 5 ? (
              <Button type="button" fullWidth onClick={f.handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button type="submit" fullWidth isLoading={f.isLoading} disabled={f.isSubmitBlocked}>
                {f.isLoading
                  ? f.isEdit
                    ? 'Guardando...'
                    : 'Creando...'
                  : f.isEdit
                    ? 'Actualizar producto'
                    : 'Crear producto'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
