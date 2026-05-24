/**
 * @fileoverview Ruta de Next.js principal para la consulta de Seguros Mercantil (/mercantil/consulta).
 * @description Renderiza el wizard modular simplificado de 5 pasos para validación, cotización, y emisión directa de pólizas.
 * @module app/mercantil/consulta/page
 */

'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMercantilConsulta } from '@/src/hooks/pages/useMercantilConsulta'
import { Step1InsuredData } from '@/components/molecules/MercantilSteps/Step1InsuredData'
import { Step2PlanSelection } from '@/components/molecules/MercantilSteps/Step2PlanSelection'
import { Step3DniUpload } from '@/components/molecules/MercantilSteps/Step3DniUpload'
import { Step4CompleteData } from '@/components/molecules/MercantilSteps/Step4CompleteData'
import { Step5Confirmation } from '@/components/molecules/MercantilSteps/Step5Confirmation'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Button } from '@/components/atoms/Button/Button'

const TOTAL_STEPS = 5
const STEP_LABELS = [
  'Datos del Asegurado',
  'Selección de Planes',
  'Cédula del Asegurado',
  'Completar Datos',
  'Confirmación',
]

/**
 * Renderiza el indicador superior de progreso para el asistente de 5 pasos.
 * @param {{ currentStep: number }} props - Propiedades del componente.
 */
function StepsProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full flex items-center mb-8 bg-gray-50/50 p-4 border border-gray-100 rounded-2xl">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center flex-1 min-w-0">
          <div
            className={`h-8 w-8 rounded-full grid place-content-center text-[11px] font-bold shrink-0 border-2 transition-all duration-300 ${
              currentStep >= s
                ? 'bg-secondary border-secondary text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-400'
            }`}
            title={STEP_LABELS[s - 1]}
          >
            {currentStep > s ? '✓' : s}
          </div>
          {s < TOTAL_STEPS && (
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

/**
 * Contenedor reactivo del asistente de consulta de Mercantil.
 */
function MercantilConsultaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedSlug = searchParams.get('slug')
  const isEmbedded = searchParams.get('embedded') === '1'

  // Inicializar hook con slug para pre-filtrado si existe en query params
  const m = useMercantilConsulta(requestedSlug)

  const handleCompletion = () => {
    if (isEmbedded) {
      notifyEmbeddedParent('completed', {
        amount: m.shopcartSummary?.quotedAmount ?? m.totalEstimatedPrime,
        policyCount: m.policyData?.length ?? 0,
        shopcartId: m.shopcartId ?? undefined,
      })
      return
    }

    router.push('/dashboard/enterprise/shop')
  }

  return (
    <main
      className={`min-h-screen bg-gray-50/50 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center animate-fadeIn relative ${isEmbedded ? 'py-6' : 'py-12'}`}
    >
      {/* OVERLAY DE CARGA PREMIUM DURANTE EL POLLING DE EMISIÓN */}
      {(m.emissionStatus === 'emitting' || m.emissionStatus === 'polling') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center shadow-2xl max-w-sm mx-4 text-center border border-gray-100 animate-scaleIn">
            <div className="relative mb-5">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-secondary border-t-transparent" />
              <div className="absolute inset-0 flex items-center justify-center text-secondary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 animate-pulse"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-bold text-body mb-2">Emitiendo tu póliza...</h3>
            <p className="text-xs text-body-muted leading-relaxed">
              Por favor espera mientras validamos tus datos y procesamos el certificado oficial con
              Mercantil Seguros en tiempo real. Este proceso puede tardar hasta 2 minutos.
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
        <StepsProgressBar currentStep={m.step} />

        {/* Banner de error de emisión en caso de falla con opción de reintento */}
        {m.emissionStatus === 'error' && m.stepError && (
          <div className="mb-6 w-full animate-fadeIn flex flex-col gap-3">
            <Alert type="error" message={m.stepError} onDismiss={() => m.setStepError('')} />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => void m.handleEmitPolicy()}
                className="text-xs h-9 px-4 font-bold"
              >
                Reintentar Emisión de Póliza
              </Button>
            </div>
          </div>
        )}

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
            <Step5Confirmation
              shopcartId={m.shopcartId ?? ''}
              policyData={m.policyData}
              onClose={handleCompletion}
            />
          )}
        </div>
      </div>
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
