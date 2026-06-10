/**
 * @fileoverview Ruta de Next.js principal para la consulta de Seguros Mercantil (/mercantil/consulta).
 * @description Renderiza el wizard modular simplificado de 5 pasos para validación, cotización, y emisión directa de pólizas.
 * @module app/mercantil/consulta/page
 */

'use client'

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMercantilConsulta } from '@/src/hooks/pages/useMercantilConsulta'
import { Step1InsuredData } from '@/components/molecules/MercantilSteps/Step1InsuredData'
import { Step2PlanSelection } from '@/components/molecules/MercantilSteps/Step2PlanSelection'
import { Step3DniUpload } from '@/components/molecules/MercantilSteps/Step3DniUpload'
import { Step4CompleteData } from '@/components/molecules/MercantilSteps/Step4CompleteData'
import { Step5Confirmation } from '@/components/molecules/MercantilSteps/Step5Confirmation'
import { R4PaymentStep } from '@/components/molecules/R4PaymentStep/R4PaymentStep'
import { R4DomiciliationStep } from '@/components/molecules/R4DomiciliationStep/R4DomiciliationStep'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Button } from '@/components/atoms/Button/Button'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { ProfileSelectorModal } from '@/components/molecules/ProfileSelectorModal/ProfileSelectorModal'
import { BlockedAccessModal } from '@/components/molecules/BlockedAccessModal/BlockedAccessModal'

const TOTAL_STEPS = 5
const STEP_LABELS = [
  'Datos del Asegurado',
  'Selección de Planes',
  'Cédula del Asegurado',
  'Completar Datos',
  'Confirmación',
]

/**
 * Renderiza el indicador superior de progreso para el asistente dinámico.
 * @param {{ currentStep: number; totalSteps: number; stepLabels: string[] }} props - Propiedades del componente.
 */
function StepsProgressBar({
  currentStep,
  totalSteps,
  stepLabels,
}: {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}) {
  return (
    <div className="w-full flex items-center mb-8 bg-gray-50/50 p-4 border border-gray-100 rounded-2xl">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center flex-1 min-w-0">
          <div
            className={`h-8 w-8 rounded-full grid place-content-center text-[11px] font-bold shrink-0 border-2 transition-all duration-300 ${
              currentStep >= s
                ? 'bg-secondary border-secondary text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-400'
            }`}
            title={stepLabels[s - 1]}
          >
            {currentStep > s ? '✓' : s}
          </div>
          {s < totalSteps && (
            <div className="h-0.5 flex-1 bg-gray-100 rounded mx-1.5 overflow-hidden">
              <div
                className={`h-full rounded bg-secondary transition-all duration-500 ease-out ${
                  currentStep > s ? 'w-full' : 'w-0'
                }`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Notifica al contenedor padre que el flujo embebido finalizo o fue cancelado.
 * @param {'completed' | 'cancelled'} type - Tipo de evento a comunicar.
 * @param {{ amount?: number; policyCount?: number; shopcartId?: string }} [payload] - Datos adicionales del flujo.
 */
function notifyEmbeddedParent(
  type: 'completed' | 'cancelled',
  payload?: { amount?: number; policyCount?: number; shopcartId?: string },
) {
  if (typeof window === 'undefined' || window.parent === window) return

  window.parent.postMessage(
    {
      source: 'mercantil-consulta',
      type,
      ...payload,
    },
    window.location.origin,
  )
}

function InsurancePendingConfirmation({
  onClose,
  amountUsd,
  isFinanced,
}: {
  onClose: () => void
  amountUsd: number
  isFinanced: boolean
}) {
  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto py-6 px-4 gap-6 animate-scaleIn">
      <div className="relative">
        <div className="p-4 bg-amber-50 text-amber-500 rounded-full shadow-md">
          <CheckCircle className="h-12 w-12 animate-pulse" strokeWidth={1.5} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-body">¡Pago Registrado!</h2>
        <p className="text-sm font-semibold text-secondary mt-1">
          Solicitud de Póliza en Proceso de Conciliación
        </p>
        <p className="text-xs text-body-muted mt-2 leading-relaxed">
          Su pago de <span className="font-semibold text-body">${amountUsd.toFixed(2)}</span> mediante Banco R4 ha sido recibido de conformidad.
          El departamento de finanzas está verificando la transacción. Recibirá su póliza definitiva a la brevedad en su correo afiliado.
        </p>
      </div>

      <div className="w-full border-t border-gray-100 pt-5 my-2">
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/20 p-4 text-left flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Estado de la Solicitud</span>
          <p className="text-xs text-body-muted">
            Estado: <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">Pendiente de Aprobación</span>
          </p>
          <p className="text-[10px] text-body-muted">
            Canal de financiamiento: <span className="font-semibold text-body">{isFinanced ? 'Cuotas Domiciliadas R4' : 'Pago de Contado'}</span>
          </p>
        </div>
      </div>

      <Button onClick={onClose} fullWidth className="mt-2">
        Finalizar Proceso <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  )
}

/**
 * Contenedor reactivo del asistente de consulta de Mercantil.
 */
function MercantilConsultaContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const requestedSlug = searchParams.get('slug')
  const isEmbedded = searchParams.get('embedded') === '1'

  // Inicializar hook con slug y params de consulta para gate de identidad.
  const m = useMercantilConsulta(requestedSlug, {
    isEmbedded,
    pathname,
    searchParams,
  })

  const handleCompletion = () => {
    if (isEmbedded) {
      notifyEmbeddedParent('completed', {
        amount: m.totalEstimatedPrime,
        policyCount: 0,
        shopcartId: m.shopcartId ?? undefined,
      })
      return
    }

    router.push('/dashboard/enterprise/shop')
  }

  // Configuración dinámica de pasos basándose en si es pago anual único o financiado
  const totalSteps = m.isAnnual ? 6 : 7
  const stepLabels = m.isAnnual
    ? [
        'Datos del Asegurado',
        'Selección de Planes',
        'Cédula del Asegurado',
        'Completar Datos',
        'Pago C2P R4',
        'Confirmación',
      ]
    : [
        'Datos del Asegurado',
        'Selección de Planes',
        'Cédula del Asegurado',
        'Completar Datos',
        'Pago C2P R4',
        'Domiciliación R4',
        'Confirmación',
      ]

  return (
    <main
      className={`min-h-screen bg-gray-50/50 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center animate-fadeIn relative ${isEmbedded ? 'py-6' : 'py-12'}`}
    >
      {/* OVERLAY DE CARGA PREMIUM DURANTE CONCILIACIÓN/GUARDADO LOCAL */}
      {m.finishingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center shadow-2xl max-w-sm mx-4 text-center border border-gray-100 animate-scaleIn">
            <div className="relative mb-5">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-secondary border-t-transparent" />
            </div>
            <h3 className="text-lg font-bold text-body mb-2">Registrando tu seguro...</h3>
            <p className="text-xs text-body-muted leading-relaxed">
              Por favor espera mientras conciliamos el pago de R4 y registramos su solicitud en el portal corporativo.
            </p>
          </div>
        </div>
      )}

      <div className={`w-full ${isEmbedded ? 'max-w-6xl' : 'max-w-2xl'}`}>
        {/* Cabecera del Portal */}
        {!isEmbedded && (
          <div className="flex flex-col items-center text-center gap-2 mb-8">
            <h1 className="text-2xl font-black tracking-tight text-body">
              Portal de Consulta{' '}
              <span className="text-secondary font-black">Mercantil Seguros</span>
            </h1>
            <p className="text-sm text-body-muted max-w-md">
              Adquiera seguros masivos y cotice planes de protección en tiempo real de forma segura.
            </p>
          </div>
        )}

        {/* Indicador de progreso */}
        <StepsProgressBar currentStep={m.step} totalSteps={totalSteps} stepLabels={stepLabels} />

        {/* Tarjeta Envolvente Principal del Wizard */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xl shadow-black/3">
          {m.step === 1 && (
            <Step1InsuredData
              insured={m.insured}
              setInsured={m.setInsured}
              loading={m.loading}
              errorMessage={m.errorMessage}
              setErrorMessage={m.setErrorMessage}
              onSubmit={m.handleSearchPlans}
            />
          )}

          {m.step === 2 && (
            <Step2PlanSelection
              categories={m.categories}
              filteredCategories={m.filteredCategories}
              birthDate={m.insured.birthDate}
              genderId={m.insured.genderId}
              selectedPlans={m.selectedPlans}
              togglePlan={m.togglePlan}
              updateFrequency={m.updateFrequency}
              termsAccepted={m.termsAccepted}
              setTermsAccepted={m.setTermsAccepted}
              healthAccepted={m.healthAccepted}
              setHealthAccepted={m.setHealthAccepted}
              showHealthDisclosure={m.showHealthDisclosure}
              setShowHealthDisclosure={m.setShowHealthDisclosure}
              loading={m.step3Loading}
              stepError={m.stepError}
              onBack={m.handleBack}
              onNext={m.handleContinueToStep3}
            />
          )}

          {m.step === 3 && (
            <Step3DniUpload
              idFile={m.idFile}
              setIdFile={m.setIdFile}
              dragActive={m.dragActive}
              setDragActive={m.setDragActive}
              loading={m.step4Loading}
              stepError={m.stepError}
              onBack={m.handleBack}
              onNext={m.handleContinueToStep4}
            />
          )}

          {m.step === 4 && (
            <Step4CompleteData
              countries={m.countries}
              countryLocations={m.countryLocations}
              loadingCountries={m.loadingCountries}
              loadingLocations={m.loadingLocations}
              selectedCountryOfBirthId={m.selectedCountryOfBirthId}
              setSelectedCountryOfBirthId={m.setSelectedCountryOfBirthId}
              civilStateId={m.civilStateId}
              setCivilStateId={m.setCivilStateId}
              selectedAdministrativeAreaId={m.selectedAdministrativeAreaId}
              setSelectedAdministrativeAreaId={m.setSelectedAdministrativeAreaId}
              selectedSubAdministrativeAreaId={m.selectedSubAdministrativeAreaId}
              setSelectedSubAdministrativeAreaId={m.setSelectedSubAdministrativeAreaId}
              selectedLocalityId={m.selectedLocalityId}
              setSelectedLocalityId={m.setSelectedLocalityId}
              selectedZoneId={m.selectedZoneId}
              setSelectedZoneId={m.setSelectedZoneId}
              addressLine={m.addressLine}
              setAddressLine={m.setAddressLine}
              postalCode={m.postalCode}
              setPostalCode={m.setPostalCode}
              loading={m.step5Loading}
              stepError={m.stepError}
              onBack={m.handleBack}
              onNext={m.handleCompleteClient}
            />
          )}

          {m.step === 5 && (
            <R4PaymentStep
              amountUsd={m.totalEstimatedPrime}
              exchangeRate={m.exchangeRate}
              defaultPayerName={`${m.insured.firstName} ${m.insured.lastName}`}
              defaultPayerDocument={`${m.insured.docType}-${m.insured.docNumber}`}
              defaultPayerPhone={`${m.insured.phoneCode}${m.insured.phoneNumber}`}
              paymentConcept={`Compra Seguro Mercantil: ${m.selectedPlans[0]?.product.title || 'Plan'}`}
              onPaymentSuccess={m.handlePaymentSuccess}
              onBack={m.handleBack}
            />
          )}

          {m.step === 6 && !m.isAnnual && (
            <R4DomiciliationStep
              quotaAmountUsd={m.totalEstimatedPrime / (m.selectedPlans[0]?.frequency === 'monthly' ? 12 : (m.selectedPlans[0]?.frequency === 'quarterly' ? 4 : 2))}
              exchangeRate={m.exchangeRate}
              defaultHolderName={`${m.insured.firstName} ${m.insured.lastName}`}
              defaultHolderDocument={`${m.insured.docType}-${m.insured.docNumber}`}
              frequencyLabel={m.selectedPlans[0]?.frequency === 'monthly' ? 'Mensual' : (m.selectedPlans[0]?.frequency === 'quarterly' ? 'Trimestral' : 'Semestral')}
              domiciliationConcept={`Domiciliación Seguro Mercantil: ${m.selectedPlans[0]?.product.title || 'Plan'}`}
              onDomiciliationSuccess={m.handleDomiciliationSuccess}
              onBack={m.handleBack}
            />
          )}

          {m.step === (m.isAnnual ? 6 : 7) && (
            <InsurancePendingConfirmation
              onClose={handleCompletion}
              amountUsd={m.totalEstimatedPrime}
              isFinanced={!m.isAnnual}
            />
          )}
        </div>
      </div>

      {/* Modales del gate de identidad */}
      {m.consultationAuthView.kind === 'profile_selector' && (
        <ProfileSelectorModal
          isOpen
          profiles={m.consultationAuthView.profiles}
          reason={m.consultationAuthView.reason}
          onSelect={(profile) => void m.consultationAuthSelectProfile(profile)}
          onClose={m.consultationAuthCancel}
        />
      )}
      {m.consultationAuthView.kind === 'blocked' && (
        <BlockedAccessModal isOpen onClose={m.consultationAuthCancel} />
      )}
    </main>
  )
}

/**
 * Vista Next.js de consulta de Mercantil (/mercantil/consulta) que maneja hidratación de URL params de forma segura.
 */
export default function MercantilConsultaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-secondary border-t-transparent rounded-full" />
            <p className="text-xs text-body-muted font-semibold tracking-wider uppercase">
              Cargando Portal Mercantil...
            </p>
          </div>
        </div>
      }
    >
      <MercantilConsultaContent />
    </Suspense>
  )
}
