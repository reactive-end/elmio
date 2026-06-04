/**
 * @fileoverview Ruta de Next.js para la consulta RCV de La Mundial de Seguros (/mundial/consulta-rcv).
 * @description Wizard de 7 pasos para cotización y emisión síncrona de pólizas RCV.
 * @module app/mundial/consulta-rcv/page
 */

'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMundialConsultaRCV } from '@/src/hooks/pages/useMundialConsultaRCV'
import { Step1InsuredData } from '@/components/molecules/MundialRCVSteps/Step1InsuredData'
import { Step2VehicleData } from '@/components/molecules/MundialRCVSteps/Step2VehicleData'
import { Step3PlanSelection } from '@/components/molecules/MundialRCVSteps/Step3PlanSelection'
import { Step4Documents } from '@/components/molecules/MundialRCVSteps/Step4Documents'
import { Step5CompleteVehicle } from '@/components/molecules/MundialRCVSteps/Step5CompleteVehicle'
import { Step6CompleteData } from '@/components/molecules/MundialRCVSteps/Step6CompleteData'
import { Step7Confirmation } from '@/components/molecules/MundialRCVSteps/Step7Confirmation'
import { Alert } from '@/components/atoms/Alert/Alert'

const STEP_LABELS = [
  'Datos del Asegurado',
  'Datos del Vehículo',
  'Selección de Planes',
  'Documentos',
  'Completar Vehículo',
  'Completar Datos',
  'Confirmación',
]

function StepsProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full flex items-center mb-8 bg-gray-50/50 p-4 border border-gray-100 rounded-2xl">
      {Array.from({ length: STEP_LABELS.length }, (_, i) => i + 1).map((s) => (
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
          {s < STEP_LABELS.length && (
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

function notifyEmbeddedParent(
  type: 'completed' | 'cancelled',
  payload?: { amount?: number; policyCount?: number; shopcartId?: string },
) {
  if (typeof window === 'undefined' || window.parent === window) return

  window.parent.postMessage(
    {
      source: 'mercantil-consulta', // Reusamos el source para que se integre transparente en el modal actual
      type,
      ...payload,
    },
    window.location.origin,
  )
}

function MundialConsultaRCVContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEmbedded = searchParams.get('embedded') === '1'
  const m = useMundialConsultaRCV()

  const handleCompletion = () => {
    if (isEmbedded) {
      notifyEmbeddedParent('completed', {
        amount: m.plans.find((p) => p.id === m.selectedPlanId)?.totalPrime || 0,
        policyCount: m.policyData?.length ?? 0,
        shopcartId: m.shopcartId ?? undefined,
      })
      return
    }

    router.push('/dashboard/enterprise/shop')
  }

  return (
    <main
      className={`min-h-screen bg-gray-50/50 px-4 sm:px-6 lg:px-8 flex flex-col items-center animate-fadeIn ${isEmbedded ? 'py-6' : 'py-12'}`}
    >
      {m.emissionStatus === 'emitting' && (
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
            <h3 className="text-lg font-bold text-body mb-2">Emitiendo tu póliza RCV...</h3>
            <p className="text-xs text-body-muted leading-relaxed">
              Por favor espera mientras validamos tus datos en el API de La Mundial de Seguros y
              procesamos tu certificado.
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl">
        <StepsProgressBar currentStep={m.step} />

        {m.stepError && (
          <div className="mb-6 w-full animate-fadeIn flex flex-col gap-3">
            <Alert type="error" message={m.stepError} onDismiss={() => m.setStepError('')} />
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xl shadow-black/3">
          {m.step === 1 && (
            <Step1InsuredData
              insured={m.insured}
              setInsured={m.setInsured}
              loading={false}
              errorMessage={m.errorMessage}
              onSubmit={m.handleClientSubmit}
            />
          )}

          {m.step === 2 && (
            <Step2VehicleData
              year={m.year}
              setYear={m.setYear}
              brand={m.brand}
              setBrand={m.setBrand}
              model={m.model}
              setModel={m.setModel}
              version={m.version}
              setVersion={m.setVersion}
              hasArmor={m.hasArmor}
              setHasArmor={m.setHasArmor}
              years={m.years}
              brands={m.brands}
              models={m.models}
              versions={m.versions}
              loadingBrands={m.loadingBrands}
              loadingModels={m.loadingModels}
              loadingVersions={m.loadingVersions}
              loadingPlans={m.loadingPlans}
              handleYearChange={m.handleYearChange}
              handleBrandChange={m.handleBrandChange}
              handleModelChange={m.handleModelChange}
              handleVersionChange={m.handleVersionChange}
              isVehicleFormValid={m.isVehicleFormValid}
              onSubmit={m.handleVehicleSubmit}
              onBack={m.handleBack}
            />
          )}

          {m.step === 3 && (
            <Step3PlanSelection
              plans={m.plans}
              selectedPlanId={m.selectedPlanId}
              setSelectedPlanId={m.setSelectedPlanId}
              termsAccepted={m.termsAccepted}
              setTermsAccepted={m.setTermsAccepted}
              loading={m.loadingPlans}
              onBack={m.handleBack}
              onNext={m.handleContinueToStep4}
            />
          )}

          {m.step === 4 && (
            <Step4Documents
              idFile={m.idFile}
              setIdFile={m.setIdFile}
              vehiclePropertyFile={m.vehiclePropertyFile}
              setVehiclePropertyFile={m.setVehiclePropertyFile}
              dragActive={m.dragActive}
              setDragActive={m.setDragActive}
              dragActiveProperty={m.dragActiveProperty}
              setDragActiveProperty={m.setDragActiveProperty}
              fileInputRef={m.fileInputRef}
              propertyFileInputRef={m.propertyFileInputRef}
              handleFileDrop={m.handleFileDrop}
              handleFileSelect={m.handleFileSelect}
              handlePropertyFileDrop={m.handlePropertyFileDrop}
              handlePropertyFileSelect={m.handlePropertyFileSelect}
              loading={m.loadingDocuments}
              onBack={m.handleBack}
              onNext={m.handleContinueToStep5}
            />
          )}

          {m.step === 5 && (
            <Step5CompleteVehicle
              vehicleColorId={m.vehicleColorId}
              setVehicleColorId={m.setVehicleColorId}
              vehiclePlate={m.vehiclePlate}
              setVehiclePlate={m.setVehiclePlate}
              vehicleChassisSerial={m.vehicleChassisSerial}
              setVehicleChassisSerial={m.setVehicleChassisSerial}
              vehicleEngineSerial={m.vehicleEngineSerial}
              setVehicleEngineSerial={m.setVehicleEngineSerial}
              isVehicleCompletionValid={m.isVehicleCompletionValid}
              onBack={m.handleBack}
              onNext={m.handleCompleteVehicleStep}
            />
          )}

          {m.step === 6 && (
            <Step6CompleteData
              states={m.states}
              cities={m.cities}
              civilStates={m.civilStates}
              genders={m.genders}
              selectedStateId={m.selectedStateId}
              selectedCityId={m.selectedCityId}
              setSelectedCityId={m.setSelectedCityId}
              civilStateId={m.civilStateId}
              setCivilStateId={m.setCivilStateId}
              addressLine={m.addressLine}
              setAddressLine={m.setAddressLine}
              postalCode={m.postalCode}
              setPostalCode={m.setPostalCode}
              handleStateChange={m.handleStateChange}
              loading={m.completeLoading}
              onBack={m.handleBack}
              onNext={m.handleContinueToStep6}
            />
          )}

          {m.step === 7 && (
            <Step7Confirmation policyData={m.policyData} onClose={handleCompletion} />
          )}
        </div>
      </div>
    </main>
  )
}

export default function MundialConsultaRCVPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-secondary border-t-transparent rounded-full" />
            <p className="text-xs text-body-muted font-semibold tracking-wider uppercase">
              Cargando Consulta RCV La Mundial...
            </p>
          </div>
        </div>
      }
    >
      <MundialConsultaRCVContent />
    </Suspense>
  )
}
