'use client'

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
  } = useEnterpriseShop()

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
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredProducts.map((product) => {
            const price = product.priceLists[0]?.amount ?? 0
            return (
              <article
                key={product.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-black/3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">
                        {product.type}
                      </span>
                      {product.windows.length > 0 && (
                        <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                          {product.windows.length} acciones
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-semibold text-body">{product.name}</h2>
                    <p className="mt-1 text-sm text-body-muted">
                      {product.description || 'Sin descripcion.'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-body-muted">
                      Precio
                    </p>
                    <p className="mt-1 text-lg font-bold text-body">{fmt(price)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-body-muted">
                  <span className="rounded-lg bg-gray-100 px-2.5 py-1">SKU: {product.sku}</span>
                  <span className="rounded-lg bg-gray-100 px-2.5 py-1">
                    Categoria: {product.category}
                  </span>
                  <span className="rounded-lg bg-gray-100 px-2.5 py-1">
                    Modo de pago: {product.paymentMode}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="text-xs text-body-muted">
                    La compra se cargara a tu estado de cuenta.
                  </p>
                  <Button onClick={() => startPurchase(product)}>
                    <ShoppingCart className="h-4 w-4" strokeWidth={1.5} /> Comprar
                  </Button>
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
                <span className="font-semibold text-body">
                  {fmt(purchaseDraft.product.priceLists[0]?.amount ?? 0)}
                </span>
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
                  <FormField label="Notas para la compra">
                    <Input
                      value={purchaseDraft.customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Indica cualquier detalle adicional para procesar la orden"
                    />
                  </FormField>
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
    </div>
  )
}
