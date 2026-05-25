/**
 * @fileoverview Componente de Paso 2: Selección de Planes.
 * @description Muestra las pólizas disponibles para el asegurado, permitiendo seleccionar planes y frecuencias de facturación.
 * @module components/molecules/MercantilSteps/Step2PlanSelection
 */

'use client'

import { Shield, AlertCircle, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Select } from '@/components/atoms/Select/Select'
import { Toggle } from '@/components/atoms/Toggle/Toggle'
import {
  type SelectedPlan,
  type PaymentFrequency,
  type AllowedProductSlug,
  calculateAge,
  formatCurrency,
  FREQUENCY_LABELS,
  FREQUENCY_DIVISORS,
  HEALTH_DISCLOSURE_TEXT,
  TERMS_PDF,
  PRODUCT_PDFS,
} from '@/src/hooks/pages/useMercantilConsulta'
import {
  type MercantilCategoryResult,
  type MercantilProduct,
  type MercantilPlan,
  type MercantilGender,
} from '@/src/services/mercantil.service'

interface Step2PlanSelectionProps {
  /** Estructura de categorías y productos disponibles */
  categories: MercantilCategoryResult[]
  /** Categorías filtradas y elegibles según edad y género */
  filteredCategories: MercantilCategoryResult[]
  /** Fecha de nacimiento del asegurado */
  birthDate: string
  /** Género del asegurado */
  genderId: MercantilGender
  /** Planes seleccionados activamente */
  selectedPlans: SelectedPlan[]
  /** Función para seleccionar/deseleccionar un plan */
  togglePlan: (product: MercantilProduct, plan: MercantilPlan) => void
  /** Función para cambiar la frecuencia de pago de un plan */
  updateFrequency: (productId: string, planId: string, frequency: PaymentFrequency) => void
  /** Estado de aceptación de términos y condiciones */
  termsAccepted: boolean
  /** Función para actualizar la aceptación de términos */
  setTermsAccepted: (accepted: boolean) => void
  /** Estado de aceptación de la declaración de salud */
  healthAccepted: boolean
  /** Función para actualizar la aceptación de salud */
  setHealthAccepted: (accepted: boolean) => void
  /** Estado de visibilidad de la declaración de salud detallada */
  showHealthDisclosure: boolean
  /** Función para actualizar la visibilidad del modal de salud */
  setShowHealthDisclosure: (show: boolean) => void
  /** Indicador de carga de la transición */
  loading: boolean
  /** Mensaje de error si la transición falla */
  stepError: string
  /** Función para retroceder un paso */
  onBack: () => void
  /** Función para avanzar al paso 3 */
  onNext: () => Promise<void>
}

export function Step2PlanSelection({
  filteredCategories,
  birthDate,
  genderId,
  selectedPlans,
  togglePlan,
  updateFrequency,
  termsAccepted,
  setTermsAccepted,
  healthAccepted,
  setHealthAccepted,
  showHealthDisclosure,
  setShowHealthDisclosure,
  loading,
  stepError,
  onBack,
  onNext,
}: Step2PlanSelectionProps) {
  const age = calculateAge(birthDate)

  // Calcular prima estimada total
  const totalBsMonthlyEstimate = selectedPlans.reduce((acc, item) => {
    const divisor = FREQUENCY_DIVISORS[item.frequency]
    return acc + (item.plan.totalPrime || 0) / divisor
  }, 0)

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
          <Shield className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-body">Selección de Planes</h2>
          <p className="text-xs text-body-muted">
            Polizas disponibles para un perfil de <span className="font-semibold">{age} años</span>{' '}
            ({genderId === 'M' ? 'Masculino' : 'Femenino'}).
          </p>
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center bg-gray-50/50">
          <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-body">Sin planes elegibles</p>
          <p className="text-xs text-body-muted mt-1">
            Lamentablemente, no existen planes Mercantil disponibles para su rango de edad o sexo.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredCategories.map((cat) => (
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-body">{product.title}</h4>
                        <p className="text-xs text-body-muted mt-0.5">
                          {product.description || 'Seguro masivo de Mercantil.'}
                        </p>
                      </div>
                      {product.slug && PRODUCT_PDFS[product.slug as AllowedProductSlug] && (
                        <div className="flex gap-2 text-[10px] font-semibold text-secondary">
                          <a
                            href={PRODUCT_PDFS[product.slug as AllowedProductSlug].particulares}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" /> Cond. Particulares
                          </a>
                          <span className="text-gray-300">|</span>
                          <a
                            href={PRODUCT_PDFS[product.slug as AllowedProductSlug].generales}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" /> Cond. Generales
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                      {product.plans?.map((plan) => {
                        const isSelected = selectedPlans.some((sp) => sp.plan.id === plan.id)
                        const draft = selectedPlans.find((sp) => sp.plan.id === plan.id)
                        return (
                          <div
                            key={plan.id}
                            onClick={() => togglePlan(product, plan)}
                            className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                                : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span
                                  className={`text-xs font-semibold uppercase tracking-wider ${isSelected ? 'text-secondary' : 'text-gray-400'}`}
                                >
                                  Suma Asegurada
                                </span>
                                <p className="text-lg font-bold text-body">
                                  {formatCurrency(plan.assuredSum || 0)}
                                </p>
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

                            <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-1">
                              <div>
                                <span className="text-[10px] text-gray-400">Prima Anual</span>
                                <p className="text-xs font-semibold text-body">
                                  {formatCurrency(plan.totalPrime || 0)} / año
                                </p>
                              </div>
                              {isSelected && draft && (
                                <div
                                  className="flex flex-col gap-1 items-end"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="text-[10px] text-gray-400 font-semibold">
                                    Frecuencia de pago
                                  </span>
                                  <Select
                                    value={draft.frequency}
                                    onChange={(v) =>
                                      updateFrequency(product.id, plan.id, v as PaymentFrequency)
                                    }
                                    options={Object.keys(FREQUENCY_LABELS).map((freqKey) => {
                                      const key = freqKey as PaymentFrequency
                                      const divCost =
                                        (plan.totalPrime || 0) / FREQUENCY_DIVISORS[key]
                                      return {
                                        value: key,
                                        label: `${FREQUENCY_LABELS[key]} (${formatCurrency(divCost)})`,
                                      }
                                    })}
                                    className="text-xs min-w-[200px]"
                                  />
                                </div>
                              )}
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

          {/* Sección de Declaraciones Juradas y Términos */}
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

                <div className="flex items-center gap-3 text-xs text-body p-1">
                  <Toggle checked={healthAccepted} onChange={setHealthAccepted} />
                  <span>
                    Declaro bajo fe de juramento que me encuentro en{' '}
                    <button
                      type="button"
                      onClick={() => setShowHealthDisclosure(true)}
                      className="font-semibold text-secondary hover:underline"
                    >
                      Perfecto Estado de Salud
                    </button>{' '}
                    y no padezco patologías preexistentes de exclusión absoluta.
                  </span>
                </div>
              </div>

              {/* Resumen Totalizador */}
              <div className="flex justify-between items-center bg-secondary/5 rounded-2xl border border-secondary/15 p-4 mt-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                    Prima Total Estimada
                  </p>
                  <p className="text-xs text-body-muted mt-0.5">
                    Calculada según frecuencias asignadas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-secondary">
                    {formatCurrency(totalBsMonthlyEstimate)}
                  </p>
                  <p className="text-[10px] text-body-muted mt-0.5">Monto de primera cuota total</p>
                </div>
              </div>
            </div>
          )}

          {/* Navegación */}
          <div className="flex gap-3 border-t border-gray-100 pt-5 mt-4">
            <Button type="button" variant="ghost" fullWidth onClick={onBack}>
              Anterior
            </Button>
            <Button
              type="button"
              fullWidth
              disabled={selectedPlans.length === 0 || !termsAccepted || !healthAccepted}
              isLoading={loading}
              onClick={onNext}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Modal Declaración de Salud */}
      {showHealthDisclosure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowHealthDisclosure(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl animate-scaleIn">
            <h3 className="text-lg font-bold text-body mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-secondary" /> Declaración Jurada de Salud
            </h3>
            <div className="max-h-[300px] overflow-y-auto border border-gray-100 bg-gray-50/50 rounded-2xl p-4 text-xs leading-relaxed text-body-secondary whitespace-pre-line mb-5">
              {HEALTH_DISCLOSURE_TEXT}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setHealthAccepted(true)
                  setShowHealthDisclosure(false)
                }}
              >
                Entendido y Declarar Buena Salud
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
