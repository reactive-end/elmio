/**
 * @fileoverview Ruta de Next.js para la consulta RCV de Mercantil (/mercantil/consulta-rcv).
 * @description Wizard de 7 pasos para cotización y emisión de pólizas RCV.
 * @module app/mercantil/consulta-rcv/page
 */

'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useMercantilConsultaRCV } from '@/src/hooks/pages/useMercantilConsultaRCV';
import { Step1InsuredData } from '@/components/molecules/MercantilRCVSteps/Step1InsuredData';
import { Step2VehicleData } from '@/components/molecules/MercantilRCVSteps/Step2VehicleData';
import { Step3PlanSelection } from '@/components/molecules/MercantilRCVSteps/Step3PlanSelection';
import { Step4Documents } from '@/components/molecules/MercantilRCVSteps/Step4Documents';
import { Step5CompleteVehicle } from '@/components/molecules/MercantilRCVSteps/Step5CompleteVehicle';
import { Step6CompleteData } from '@/components/molecules/MercantilRCVSteps/Step6CompleteData';
import { Step7Confirmation } from '@/components/molecules/MercantilRCVSteps/Step7Confirmation';
import { Alert } from '@/components/atoms/Alert/Alert';
import { Button } from '@/components/atoms/Button/Button';

const STEP_LABELS = [
  'Datos del Asegurado',
  'Datos del Vehículo',
  'Selección de Planes',
  'Documentos',
  'Completar Vehículo',
  'Completar Datos',
  'Confirmación',
];

/**
 * Renderiza el indicador superior de progreso para el asistente de 7 pasos.
 * @param {{ currentStep: number }} props - Propiedades del componente.
 */
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
  );
}

/**
 * Contenedor reactivo del asistente de consulta RCV de Mercantil.
 */
function MercantilConsultaRCVContent() {
  const router = useRouter();
  const m = useMercantilConsultaRCV();

  const handleCompletion = () => {
    router.push('/dashboard/enterprise/shop');
  };

  return (
    <main className="min-h-screen bg-gray-50/50 px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center animate-fadeIn">
      {/* OVERLAY DE CARGA DURANTE EL POLLING DE EMISIÓN */}
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
              Por favor espera mientras validamos tus datos y procesamos el certificado oficial con Mercantil Seguros.
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl">
        {/* Indicador de progreso */}
        <StepsProgressBar currentStep={m.step} />

        {/* Banner de error de pasos */}
        {m.stepError && (
          <div className="mb-6 w-full animate-fadeIn flex flex-col gap-3">
            <Alert type="error" message={m.stepError} onDismiss={() => m.setStepError('')} />
            {m.emissionStatus === 'error' && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => void m.handleEmitPolicy()}
                  className="text-xs h-9 px-4 font-bold"
                >
                  Reintentar Emisión
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tarjeta principal */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xl shadow-black/3">
          {m.step === 1 && (
            <Step1InsuredData
              insured={m.insured}
              setInsured={m.setInsured}
              loading={m.step1Loading}
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
              locationId={m.locationId}
              setLocationId={m.setLocationId}
              hasArmor={m.hasArmor}
              setHasArmor={m.setHasArmor}
              years={m.years}
              brands={m.brands}
              models={m.models}
              versions={m.versions}
              locations={m.locations}
              loadingBrands={m.loadingBrands}
              loadingModels={m.loadingModels}
              loadingVersions={m.loadingVersions}
              loadingLocations={m.loadingLocations}
              handleYearChange={m.handleYearChange}
              handleBrandChange={m.handleBrandChange}
              handleModelChange={m.handleModelChange}
              handleVersionChange={m.handleVersionChange}
              isVehicleFormValid={m.isVehicleFormValid}
              loadingPlans={m.loadingPlans}
              onSubmit={m.handleVehicleSubmit}
              onBack={m.handleBack}
            />
          )}

          {m.step === 3 && (
            <Step3PlanSelection
              categories={m.planCategories}
              selectedPlans={m.selectedPlans}
              togglePlan={m.togglePlan}
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
              needsCompletion={m.needsCompletion}
              onBack={m.handleBack}
              onNext={m.handleContinueToStep5}
            />
          )}

          {m.step === 5 && (
            <Step5CompleteVehicle
              vehicleColors={m.vehicleColors}
              vehicleColorId={m.vehicleColorId}
              setVehicleColorId={m.setVehicleColorId}
              vehiclePlate={m.vehiclePlate}
              setVehiclePlate={m.setVehiclePlate}
              vehicleChassisSerial={m.vehicleChassisSerial}
              setVehicleChassisSerial={m.setVehicleChassisSerial}
              vehicleEngineSerial={m.vehicleEngineSerial}
              setVehicleEngineSerial={m.setVehicleEngineSerial}
              loadingVehicleColors={m.loadingVehicleColors}
              isVehicleCompletionValid={m.isVehicleCompletionValid}
              loading={m.vehicleCompletionLoading}
              onBack={m.handleBack}
              onNext={m.handleCompleteVehicleStep}
            />
          )}

          {m.step === 6 && (
            <Step6CompleteData
              countries={m.countries}
              countryLocations={m.countryLocations}
              loadingCountries={m.loadingCountries}
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
              loading={m.completeLoading}
              onBack={m.handleBack}
              onNext={m.handleContinueToStep6}
            />
          )}

          {m.step === 7 && (
            <Step7Confirmation
              policyData={m.policyData}
              onDownloadPdf={m.handleDownloadPdf}
              onClose={handleCompletion}
            />
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * Vista Next.js de consulta RCV Mercantil que maneja hidratación de forma segura.
 */
export default function MercantilConsultaRCVPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-secondary border-t-transparent rounded-full" />
            <p className="text-xs text-body-muted font-semibold tracking-wider uppercase">
              Cargando Consulta RCV...
            </p>
          </div>
        </div>
      }
    >
      <MercantilConsultaRCVContent />
    </Suspense>
  );
}
