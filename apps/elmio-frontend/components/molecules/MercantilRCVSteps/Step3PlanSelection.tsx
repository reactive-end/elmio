/**
 * @fileoverview Componente de Paso 3: Selección de Planes RCV.
 * @description Muestra los planes disponibles y permite seleccionar uno con términos.
 * @module components/molecules/MercantilRCVSteps/Step3PlanSelection
 */

'use client'

import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Toggle } from '@/components/atoms/Toggle/Toggle'
import type {
  MercantilCategoryResult,
  MercantilProduct,
  MercantilPlan,
  SelectedPlan,
} from '@/src/hooks/pages/useMercantilConsultaRCV'
import { formatCurrency } from '@/src/hooks/pages/useMercantilConsultaRCV'
import { TERMS_PDF } from '@/src/hooks/pages/useMercantilConsulta'

interface Step3PlanSelectionProps {
  categories: MercantilCategoryResult[]
  selectedPlans: SelectedPlan[]
  togglePlan: (product: MercantilProduct, plan: MercantilPlan) => void
  termsAccepted: boolean
  setTermsAccepted: (accepted: boolean) => void
  loading: boolean
  onBack: () => void
  onNext: () => Promise<void>
}

export function Step3PlanSelection({
  categories,
  selectedPlans,
  togglePlan,
  termsAccepted,
  setTermsAccepted,
  loading,
  onBack,
  onNext,
}: Step3PlanSelectionProps) {
  const totalPrime = selectedPlans.reduce((acc, item) => acc + (item.plan.totalPrime || 0), 0)

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
          <Shield className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-body">Selección de Planes</h2>
          <p className="text-xs text-body-muted">
            Elija el plan de RCV que se ajuste a sus necesidades.
          </p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center bg-gray-50/50">
          <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-body">Sin planes disponibles</p>
          <p className="text-xs text-body-muted mt-1">
            No existen planes RCV disponibles para este vehículo.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {categories.map((cat) => (
            <div key={cat.category} className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1.5">
                {cat.categoryTitle || cat.category}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {cat.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col gap-4 p-4 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start gap-3">
                      {product.icon?.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.icon.src}
                          alt={product.title}
                          className="h-10 w-10 shrink-0 rounded-lg object-contain bg-slate-100 p-1.5"
                        />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100" />
                      )}
                      <div className="min-w-0">
                        <h4 className="text-base font-bold text-body">{product.title}</h4>
                        <p className="text-xs text-body-muted mt-0.5">
                          {product.description || 'Seguro RCV de Mercantil.'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {product.plans?.map((plan) => {
                        const isSelected = selectedPlans.some((sp) => sp.plan.id === plan.id)
                        return (
                          <div
                            key={plan.id}
                            onClick={() => togglePlan(product, plan)}
                            className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                                : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span
                                  className={`text-[9px] font-semibold uppercase tracking-wider ${
                                    isSelected ? 'text-secondary' : 'text-gray-400'
                                  }`}
                                >
                                  Prima Anual
                                </span>
                                <p
                                  className={`text-base font-bold leading-tight ${
                                    isSelected ? 'text-secondary' : 'text-body'
                                  }`}
                                >
                                  {formatCurrency(plan.totalPrime || 0)}
                                </p>
                              </div>
                              {isSelected ? (
                                <CheckCircle2
                                  className="h-4 w-4 text-secondary shrink-0"
                                  fill="currentColor"
                                  stroke="white"
                                />
                              ) : (
                                <div className="h-4 w-4 rounded-full border border-gray-200 shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              Suma: {formatCurrency(plan.assuredSum || 0)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {selectedPlans.length > 0 && (
            <div className="border-t border-gray-100 pt-6 mt-4 flex flex-col gap-4 animate-fadeIn">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                  Declaraciones de Suscripción
                </span>
                <div className="flex items-center gap-3 text-xs text-body p-1">
                  <Toggle checked={termsAccepted} onChange={setTermsAccepted} />
                  <span>
                    Acepto los{' '}
                    <a
                      href={TERMS_PDF}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-secondary hover:underline"
                    >
                      Términos y Condiciones Generales
                    </a>{' '}
                    del servicio de Mercantil Seguros.
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-secondary/5 rounded-2xl border border-secondary/15 p-4 mt-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                    Prima Total Estimada
                  </p>
                  <p className="text-xs text-body-muted mt-0.5">
                    Prima anual del plan seleccionado
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-secondary">{formatCurrency(totalPrime)}</p>
                  <p className="text-[10px] text-body-muted mt-0.5">Monto anual</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 border-t border-gray-100 pt-5 mt-4">
            <Button type="button" variant="ghost" fullWidth onClick={onBack}>
              Anterior
            </Button>
            <Button
              type="button"
              fullWidth
              disabled={selectedPlans.length === 0 || !termsAccepted}
              isLoading={loading}
              onClick={onNext}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
