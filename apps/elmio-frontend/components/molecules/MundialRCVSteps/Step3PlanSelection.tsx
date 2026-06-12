/**
 * @fileoverview Componente de Paso 3: Selección de Planes RCV para La Mundial de Seguros.
 * @description Muestra el plan RCV cotizado dinámicamente y permite seleccionarlo con términos.
 * @module components/molecules/MundialRCVSteps/Step3PlanSelection
 */

'use client'

import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Toggle } from '@/components/atoms/Toggle/Toggle'
import { MUNDIAL_RCV_TERMS_PDF, type MundialPlan } from '@/src/hooks/pages/useMundialConsultaRCV'

interface Step3PlanSelectionProps {
  plans: MundialPlan[]
  selectedPlanId: string
  setSelectedPlanId: (id: string) => void
  termsAccepted: boolean
  setTermsAccepted: (accepted: boolean) => void
  loading: boolean
  onBack: () => void
  onNext: () => Promise<void>
}

export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function Step3PlanSelection({
  plans,
  selectedPlanId,
  setSelectedPlanId,
  termsAccepted,
  setTermsAccepted,
  loading,
  onBack,
  onNext,
}: Step3PlanSelectionProps) {
  const selectedPlan = plans.find((p) => p.id === selectedPlanId)

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
          <Shield className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-body">Selección de Planes</h2>
          <p className="text-xs text-body-muted">
            Seleccione el plan de RCV cotizado para su vehículo.
          </p>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center bg-gray-50/50">
          <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-body">Sin cotizaciones disponibles</p>
          <p className="text-xs text-body-muted mt-1">
            No se pudo cotizar un plan RCV para este vehículo. Vuelva al paso anterior e intente con
            otra versión.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4">
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-5 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-body">{plan.title}</h4>
                      <p className="text-xs text-body-muted mt-0.5">{plan.description}</p>
                    </div>
                    {isSelected ? (
                      <CheckCircle2
                        className="h-5 w-5 text-secondary shrink-0"
                        fill="currentColor"
                        stroke="white"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-gray-200 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-end justify-between gap-3 border-t border-gray-100 pt-3 mt-1">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-semibold text-gray-400">
                        Prima Anual
                      </span>
                      <p className="text-2xl font-black leading-tight text-secondary">
                        {formatCurrency(plan.totalPrime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">
                        Suma Asegurada
                      </span>
                      <p className="text-sm font-semibold text-body">
                        {formatCurrency(plan.assuredSum)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {selectedPlan && (
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
                      href={MUNDIAL_RCV_TERMS_PDF}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-secondary hover:underline"
                    >
                      Términos y Condiciones Generales
                    </a>{' '}
                    y declaro que la información ingresada es real y verídica para La Mundial de
                    Seguros.
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-secondary/5 rounded-2xl border border-secondary/15 p-4 mt-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                    Prima Total a Pagar
                  </p>
                  <p className="text-xs text-body-muted mt-0.5">
                    Prima anual del plan seleccionado
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-secondary">
                    {formatCurrency(selectedPlan.totalPrime)}
                  </p>
                  <p className="text-[10px] text-body-muted mt-0.5">Monto total (USD)</p>
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
              disabled={!selectedPlanId || !termsAccepted}
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
