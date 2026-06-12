'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CreditCard,
  ExternalLink,
  FileText,
  Package,
  Search,
  ShoppingCart,
  Sparkles,
} from 'lucide-react'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { FormField } from '@/components/molecules/FormField/FormField'
import { Select } from '@/components/atoms/Select/Select'
import { useEnterpriseShop } from '@/src/hooks/pages/useEnterpriseShop'
import { useProductHighlight } from '@/src/hooks/pages/useProductHighlight'
import { enterpriseService } from '@/src/services/empresa.service'
import { authService } from '@/src/services/auth.service'

/**
 * Marketplace empresarial con productos activos globales y flujo de compra.
 * Registra los cargos resultantes en el estado de cuenta de la empresa.
 * @returns Vista de catalogo y modal de compra para empresas.
 */
export default function EnterpriseShopPage() {
  const router = useRouter()
  const session = authService.getSession()
  const {
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
    setDocumentName,
    nextPurchaseStep,
    completePurchase,
    embeddedFormUrl,
    closeEmbeddedForm,
  } = useEnterpriseShop()

  const {
    highlightedProductId: highlightProductId,
    cardDomId,
    isActive: highlightActive,
  } = useProductHighlight(!loading)

  const [selectedProductForScheme, setSelectedProductForScheme] = useState<any | null>(null)
  const [showSchemeSelectorModal, setShowSchemeSelectorModal] = useState(false)

  const [requestSending, setRequestSending] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null)

  const handleStartPurchaseClick = (product: any) => {
    // Productos con precio por consulta (seguros): abrir la ventana embebida
    // internamente sin pasar por el wizard de pago (que exige precio fijo).
    if (product.usesThirdPartyPricing) {
      const hasQueryWindow = product.windows?.some(
        (w: any) =>
          w.type === 'custom-form' &&
          ['mercantil-query-form', 'mercantil-rcv-query-form', 'mundial-rcv-query-form'].includes(
            w.config?.redirectUrl,
          ),
      )
      if (hasQueryWindow) {
        // startPurchase crea el draft; nextPurchaseStep abre la modal
        // embebida con el iframe de consulta (manejo centralizado en el hook).
        startPurchase(product)
        void nextPurchaseStep()
        return
      }
    }

    if (product.financingSchemes && product.financingSchemes.length > 1) {
      setSelectedProductForScheme(product)
      setShowSchemeSelectorModal(true)
    } else {
      const schemeId = product.financingSchemes?.[0]?.id || 'default'
      proceedToPurchaseFlow(product, schemeId)
    }
  }

  const proceedToPurchaseFlow = async (product: any, schemeId: string) => {
    try {
      setRequestSending(true)
      setRequestError(null)
      setRequestSuccess(null)

      const amount = product.priceLists?.[0]?.amount ?? 0
      // Productos con precio por consulta (seguros) saltan el cargo directo:
      // la solicitud se registra sin monto y la consulta embebida maneja el cobro.
      const isQuoteBased = product.usesThirdPartyPricing === true || amount <= 0
      if (isQuoteBased) {
        setRequestSuccess(
          `Has iniciado el proceso de consulta para "${product.name}". Completa la ventana de consulta para registrar tu solicitud.`,
        )
        return
      }

      const concept = `Compra marketplace: ${product.name}`

      if (session?.role === 'COMPANY') {
        const me = await enterpriseService.getMe()
        if (!me) throw new Error('No se encontró la empresa asociada a la sesión.')
        await enterpriseService.createTransaction(me.id, {
          kind: 'charge',
          concept,
          amount,
          status: 'pending',
          productId: product.id,
        })
      } else {
        await enterpriseService.createMyTransaction({
          kind: 'charge',
          concept,
          amount,
          status: 'pending',
          productId: product.id,
        })
      }

      setRequestSuccess(
        `¡Solicitud enviada! Se ha generado tu solicitud de compra para "${product.name}". Una vez aprobada por tu empresa y finanzas, podrás proceder a completarla desde tu panel.`,
      )
    } catch (err) {
      console.error(err)
      setRequestError(
        err instanceof Error ? err.message : 'Error al enviar la solicitud de compra.',
      )
    } finally {
      setRequestSending(false)
    }
  }

  const handleSelectSchemeAndProceed = (schemeId: string) => {
    if (!selectedProductForScheme) return
    proceedToPurchaseFlow(selectedProductForScheme, schemeId)
    setShowSchemeSelectorModal(false)
    setSelectedProductForScheme(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(n)

  const orderedWindows = purchaseDraft
    ? [...purchaseDraft.product.windows].sort((a, b) => a.order - b.order)
    : []
  const currentWindow = purchaseDraft ? orderedWindows[purchaseDraft.currentStep] : null
  const isLastStep = purchaseDraft ? purchaseDraft.currentStep >= orderedWindows.length : false

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-body">Marketplace</h1>
          <p className="text-sm text-body-muted">
            Explora productos activos de toda la plataforma y registra compras en tu estado de
            cuenta.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() =>
            router.push(
              session?.role === 'EMPLOYEE'
                ? '/dashboard/collaborator/account-statement'
                : '/dashboard/enterprise/account-statement',
            )
          }
        >
          Ver estado de cuenta
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}
      {successMessage && <Alert type="success" message={successMessage} />}
      {requestError && <Alert type="error" message={requestError} />}
      {requestSending && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 font-medium">
          ⌛ Enviando solicitud de compra y registrando en el estado de cuenta... por favor espera.
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Buscar por nombre, SKU o categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm shadow-black/3">
          <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" strokeWidth={1.5} />
          <p className="text-sm font-medium text-body-muted">
            No hay productos activos disponibles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const price = product.priceLists[0]?.amount ?? 0
            return (
              <article
                id={cardDomId(product.id)}
                key={product.id}
                className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ${
                  highlightProductId === product.id && highlightActive
                    ? 'border-secondary/60 ring-4 ring-secondary/30 scale-[1.01] shadow-md shadow-secondary/15'
                    : highlightProductId === product.id
                      ? 'border-secondary/40'
                      : 'border-gray-100'
                } ${!product.active ? 'opacity-65 bg-gray-50/30' : ''}`}
              >
                <div className="relative flex-shrink-0 bg-gray-50 aspect-square">
                  {product.images && product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                      <Package className="h-10 w-10" strokeWidth={1.5} />
                    </div>
                  )}
                  {product.usesThirdPartyPricing ? (
                    <span className="absolute left-3 top-3 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                      Precio por consulta
                    </span>
                  ) : (
                    <span className="absolute left-3 top-3 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary">
                      {fmt(price)}
                    </span>
                  )}
                  {!product.active && (
                    <span className="absolute right-3 top-3 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
                      Inactivo
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h2 className="text-sm font-semibold text-body line-clamp-2">{product.name}</h2>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {product.description || 'Sin descripcion.'}
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button
                      onClick={() => handleStartPurchaseClick(product)}
                      disabled={!product.active}
                      variant={product.active ? 'primary' : 'ghost'}
                      fullWidth
                    >
                      {product.active ? (
                        <>
                          <ShoppingCart className="h-4 w-4" strokeWidth={1.5} /> Comprar
                        </>
                      ) : (
                        'No disponible'
                      )}
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {purchaseDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={cancelPurchase} />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
                  Flujo de compra
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-body">
                  {purchaseDraft.product.name}
                </h3>
                <p className="mt-2 text-sm text-body-muted">
                  Completa las acciones configuradas para registrar la compra en tu estado de
                  cuenta.
                </p>
              </div>
              <Button variant="ghost" onClick={cancelPurchase}>
                Cerrar
              </Button>
            </div>

            <div className="mt-5 rounded-2xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-body-muted">
                Precio principal:{' '}
                {purchaseDraft.product.usesThirdPartyPricing ? (
                  <span className="font-semibold text-body">Precio por consulta</span>
                ) : (
                  <span className="font-semibold text-body">
                    {fmt(purchaseDraft.product.priceLists[0]?.amount ?? 0)}
                  </span>
                )}
              </p>
            </div>

            {currentWindow ? (
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-secondary">
                  {currentWindow.type === 'payment-form' && <CreditCard className="h-4 w-4" />}
                  {currentWindow.type === 'custom-form' && <Sparkles className="h-4 w-4" />}
                  {currentWindow.type === 'document-upload' && <FileText className="h-4 w-4" />}
                  {currentWindow.type === 'external-redirect' && (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  {currentWindow.type === 'confirmation-dialog' && (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  <p className="text-sm font-semibold text-body">
                    {currentWindow.label || currentWindow.type}
                  </p>
                </div>

                {currentWindow.description && (
                  <p className="text-sm text-body-muted">{currentWindow.description}</p>
                )}

                {currentWindow.type === 'payment-form' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Metodo de pago" required>
                      <Select
                        value={purchaseDraft.paymentMethod}
                        onChange={setPaymentMethod}
                        options={(currentWindow.config.paymentMethods ?? ['Pago manual']).map(
                          (method) => ({ value: method, label: method }),
                        )}
                      />
                    </FormField>
                    <FormField label="Referencia" required>
                      <Input
                        value={purchaseDraft.paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="Ej: PM-123456"
                      />
                    </FormField>
                  </div>
                )}

                {currentWindow.type === 'custom-form' && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-body-secondary">
                    {session?.role === 'COMPANY'
                      ? 'Esta accion abrira la consulta de Mercantil dentro de una modal para que completes el proceso sin salir de la compra.'
                      : 'La consulta personalizada por ahora esta disponible solo para empresas.'}
                  </div>
                )}

                {currentWindow.type === 'document-upload' && (
                  <FormField label="Documento cargado" required={currentWindow.required}>
                    <Input
                      value={purchaseDraft.documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder={`Adjunto: ${(currentWindow.config.acceptedFileTypes ?? []).join(', ') || 'archivo soporte'}`}
                    />
                  </FormField>
                )}

                {currentWindow.type === 'external-redirect' && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-body-muted">
                    Este paso requiere abrir un enlace externo para completar el proceso.
                    {currentWindow.config.redirectUrl && (
                      <a
                        href={currentWindow.config.redirectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-2 font-medium text-secondary"
                      >
                        Abrir enlace <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}

                {currentWindow.type === 'confirmation-dialog' && (
                  <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {currentWindow.config.confirmationMessage ||
                      'Confirma que deseas continuar con esta compra.'}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-secondary/15 bg-secondary/5 px-4 py-4 text-sm text-body-muted">
                El producto no tiene ventanas configuradas. Puedes registrar la compra directamente.
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button variant="ghost" fullWidth onClick={cancelPurchase}>
                Cancelar
              </Button>
              {isLastStep ? (
                <Button fullWidth onClick={() => void completePurchase()}>
                  Registrar compra
                </Button>
              ) : (
                <Button fullWidth onClick={() => void nextPurchaseStep()}>
                  Continuar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      {showSchemeSelectorModal && selectedProductForScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={() => {
              setShowSchemeSelectorModal(false)
              setSelectedProductForScheme(null)
            }}
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)] animate-in fade-in zoom-in-95 duration-200">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
                Selección de Pago
              </p>
              <h3 className="mt-2 text-xl font-bold text-body">Selecciona la modalidad de pago</h3>
              <p className="mt-1 text-xs text-body-muted">
                Este producto ofrece múltiples planes de financiamiento. Elige el de tu preferencia
                para continuar.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {selectedProductForScheme.financingSchemes.map((scheme: any) => {
                const isCash = scheme.paymentMode === 'cash'

                const basePrice = selectedProductForScheme.priceLists?.[0]?.amount ?? 0

                let finalPrice = basePrice
                const isMercantil =
                  selectedProductForScheme.globalThirdPartyProvider?.includes('mercantil') ||
                  selectedProductForScheme.name.toLowerCase().includes('mercantil')

                if (!isCash && !isMercantil) {
                  const interestType = selectedProductForScheme.interestType ?? 'none'
                  const interestRate = selectedProductForScheme.interestRate ?? 0
                  if (interestType === 'percentage') {
                    finalPrice = basePrice * (1 + interestRate / 100)
                  } else if (interestType === 'fixed') {
                    finalPrice = basePrice + interestRate
                  }
                }

                const initialPct = scheme.initialPayment ?? 0
                const initialAmount = (finalPrice * initialPct) / 100
                const remainingAmount = finalPrice - initialAmount
                const quotaCount = scheme.maxQuotas ?? 1
                const quotaAmount = remainingAmount / quotaCount

                return (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => handleSelectSchemeAndProceed(scheme.id)}
                    className="w-full text-left p-4 border border-gray-200 hover:border-secondary/40 hover:bg-secondary/[0.02] rounded-2xl transition-all duration-200 cursor-pointer flex flex-col gap-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-body group-hover:text-secondary transition-colors">
                        {scheme.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                        {isCash ? 'Contado' : 'Crédito'}
                      </span>
                    </div>
                    <span className="text-xs text-body-muted leading-relaxed">
                      {isCash
                        ? `Pago único completo e inmediato de ${fmt(finalPrice)}.`
                        : `Financiamiento de ${fmt(finalPrice)} en ${scheme.maxQuotas} cuotas de ${fmt(quotaAmount)} ${
                            scheme.paymentPeriod === 'monthly' ? 'mensuales' : 'periódicas'
                          }${scheme.initialPayment > 0 ? ` con inicial de ${scheme.initialPayment}% (${fmt(initialAmount)})` : ''}.`}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-6">
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  setShowSchemeSelectorModal(false)
                  setSelectedProductForScheme(null)
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {purchaseDraft && embeddedFormUrl && session?.role === 'COMPANY' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
          <div className="relative z-10 flex h-[75vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold text-body">Mercantil Seguros</h3>
                <p className="mt-1 text-sm text-body-muted">
                  Completa el proceso de consulta mercantil dentro de esta ventana para registrar tu
                  compra.
                </p>
              </div>
              <Button variant="ghost" onClick={closeEmbeddedForm}>
                Cerrar
              </Button>
            </div>

            <div className="flex-1 bg-gray-50">
              <iframe
                title="Consulta Mercantil embebida"
                src={embeddedFormUrl}
                className="h-full w-full border-0"
                allow="clipboard-write"
              />
            </div>
          </div>
        </div>
      )}

      {requestSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setRequestSuccess(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center gap-5">
            <div className="p-4 bg-green-50 text-green-500 rounded-full shadow-sm">
              <Sparkles className="h-10 w-10 text-green-500" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-body">¡Solicitud de Compra Enviada!</h3>
              <p className="mt-2 text-sm text-body-muted leading-relaxed">{requestSuccess}</p>
            </div>
            <Button
              variant="primary"
              fullWidth
              onClick={() => setRequestSuccess(null)}
              className="py-3 font-semibold mt-2"
            >
              Aceptar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
