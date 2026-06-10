/**
 * @fileoverview Ruta de Next.js para la consulta RCV de Mercantil (/mercantil/consulta-rcv).
 * @description Wizard de 7 pasos para cotización y emisión de pólizas RCV.
 * @module app/mercantil/consulta-rcv/page
 */

'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMercantilConsultaRCV } from '@/src/hooks/pages/useMercantilConsultaRCV';
import { Step1InsuredData } from '@/components/molecules/MercantilRCVSteps/Step1InsuredData';
import { Step2VehicleData } from '@/components/molecules/MercantilRCVSteps/Step2VehicleData';
import { Step3PlanSelection } from '@/components/molecules/MercantilRCVSteps/Step3PlanSelection';
import { Step4Documents } from '@/components/molecules/MercantilRCVSteps/Step4Documents';
import { Step5CompleteVehicle } from '@/components/molecules/MercantilRCVSteps/Step5CompleteVehicle';
import { Step6CompleteData } from '@/components/molecules/MercantilRCVSteps/Step6CompleteData';
import { Step7Confirmation } from '@/components/molecules/MercantilRCVSteps/Step7Confirmation';
import { R4PaymentStep } from '@/components/molecules/R4PaymentStep/R4PaymentStep';
import { Alert } from '@/components/atoms/Alert/Alert';
import { Button } from '@/components/atoms/Button/Button';
import { CheckCircle, ArrowRight } from 'lucide-react';

const STEP_LABELS = [
  'Datos del Asegurado',
  'Datos del Vehículo',
  'Selección de Planes',
  'Documentos',
  'Completar Vehículo',
  'Completar Datos',
  'Pago C2P R4',
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
 * Notifica al contenedor padre que el flujo embebido finalizó o fue cancelado.
 * @param {'completed' | 'cancelled'} type - Tipo de evento a comunicar.
 * @param {{ amount?: number; policyCount?: number; shopcartId?: string }} [payload] - Datos adicionales del flujo.
 */
function notifyEmbeddedParent(
  type: 'completed' | 'cancelled',
  payload?: { amount?: number; policyCount?: number; shopcartId?: string },
) {
  if (typeof window === 'undefined' || window.parent === window) return;

  window.parent.postMessage(
    {
      source: 'mercantil-consulta',
      type,
      ...payload,
    },
    window.location.origin,
  );
}

function InsurancePendingConfirmation({
  onClose,
  amountUsd,
}: {
  onClose: () => void;
  amountUsd: number;
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
          Solicitud de Póliza RCV en Proceso de Conciliación
        </p>
        <p className="text-xs text-body-muted mt-2 leading-relaxed">
          Su pago de <span className="font-semibold text-body">${amountUsd.toFixed(2)}</span> mediante Banco R4 ha sido recibido de conformidad.
          El departamento de finanzas está verificando la transacción. Recibirá su póliza definitiva y certificado RCV a la brevedad en su correo afiliado.
        </p>
      </div>

      <div className="w-full border-t border-gray-100 pt-5 my-2">
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/20 p-4 text-left flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Estado de la Solicitud</span>
          <p className="text-xs text-body-muted">
            Estado: <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">Pendiente de Aprobación</span>
          </p>
          <p className="text-[10px] text-body-muted">
            Aseguradora: <span className="font-semibold text-body">Mercantil Seguros</span>
          </p>
        </div>
      </div>

      <Button onClick={onClose} fullWidth className="mt-2">
        Finalizar Proceso <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

/**
 * Contenedor reactivo del asistente de consulta RCV de Mercantil.
 */
function MercantilConsultaRCVContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get('embedded') === '1';
  const productId = searchParams.get('productId') || undefined;
  const productSku = searchParams.get('productSku') || undefined;
  const marketplaceId = searchParams.get('marketplaceId') || undefined;
  const marketplaceName = searchParams.get('marketplaceName') || undefined;
  const m = useMercantilConsultaRCV({ productId, productSku, marketplaceId, marketplaceName });

  const handleCompletion = () => {
    if (isEmbedded) {
      notifyEmbeddedParent('completed', {
        amount: m.totalEstimatedPrime || 0,
        policyCount: m.policyData?.length ?? 0,
        shopcartId: m.shopcartId ?? undefined,
      });
      return;
    }

    router.push('/dashboard/enterprise/shop');
  };

  return (
    <main className={`min-h-screen bg-gray-50/50 px-4 sm:px-6 lg:px-8 flex flex-col items-center animate-fadeIn ${isEmbedded ? 'py-6' : 'py-12'}`}>
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

      <div className="w-full max-w-5xl">
        {/* Indicador de progreso */}
        <StepsProgressBar currentStep={m.step} />

        {/* Banner de error de pasos */}
        {m.stepError && (
          <div className="mb-6 w-full animate-fadeIn flex flex-col gap-3">
            <Alert type="error" message={m.stepError} onDismiss={() => m.setStepError('')} />
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
            <R4PaymentStep
              amountUsd={m.totalEstimatedPrime}
              exchangeRate={m.exchangeRate}
              defaultPayerName={`${m.insured.firstName} ${m.insured.lastName}`}
              defaultPayerDocument={`${m.insured.docType}-${m.insured.docNumber}`}
              defaultPayerPhone={`${m.insured.phoneCode}${m.insured.phoneNumber}`}
              paymentConcept={`Compra RCV Mercantil: ${m.selectedPlans.map((p) => p.product.title || 'Plan').join(', ')}`}
              onPaymentSuccess={m.handlePaymentSuccess}
              onBack={m.handleBack}
            />
          )}

          {m.step === 8 && (
            <InsurancePendingConfirmation
              onClose={handleCompletion}
              amountUsd={m.totalEstimatedPrime}
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
