'use client'

import { Building2, Landmark, Users, Upload, ChevronRight, Check, SkipForward } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { Alert } from '@/components/atoms/Alert/Alert'
import { FormField } from '@/components/molecules/FormField/FormField'
import { StepIndicator } from '@/components/molecules/StepIndicator/StepIndicator'
import { useOnboarding } from '@/src/hooks/pages/useOnboarding'
import type { CollaboratorInput } from '@/src/services/empresa.service'
import { useState, useRef } from 'react'

const ONBOARDING_STEPS = [
  { id: 0, title: 'Empresa' },
  { id: 1, title: 'Domiciliacion' },
  { id: 2, title: 'Nomina' },
]

const STEP_MAP: Record<string, number> = {
  'company-data': 0,
  domiciliation: 1,
  payroll: 2,
}

const STEP_ICONS = [Building2, Landmark, Users]

const BANCOS = [
  { value: 'banesco', label: 'Banesco' },
  { value: 'mercantil', label: 'Mercantil' },
  { value: 'provincial', label: 'Provincial' },
  { value: 'venezuela', label: 'Venezuela' },
  { value: 'bnc', label: 'BNC' },
  { value: 'bod', label: 'BOD' },
  { value: 'bicentenario', label: 'Bicentenario' },
  { value: 'tesoro', label: 'Banco del Tesoro' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'fondo-comun', label: 'Fondo Comun' },
]

export default function OnboardingEnterprisePage() {
  const {
    step,
    loading,
    error,
    companyData,
    setCompanyData,
    submitCompanyData,
    domiciliation,
    setDomiciliation,
    submitDomiciliation,
    payrollItems,
    setPayrollItems,
    submitPayroll,
    skipPayroll,
  } = useOnboarding()

  const currentStepNum = STEP_MAP[step]
  const completedSteps = (() => {
    if (step === 'domiciliation') return [0]
    if (step === 'payroll') return [0, 1]
    return []
  })()

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 to-surface-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary/10 mb-4">
            <Building2 className="w-8 h-8 text-secondary" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-body">Configura tu empresa</h1>
          <p className="text-sm text-body-muted mt-1">
            Completa la informacion para comenzar a operar en ElMio.
          </p>
        </div>

        <StepIndicator
          steps={ONBOARDING_STEPS}
          currentStep={currentStepNum}
          completedSteps={completedSteps}
          stepIcons={STEP_ICONS}
          onStepClick={() => {}}
        />

        <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 p-6 sm:p-8">
          {error && <Alert type="error" message={error} />}

          {step === 'company-data' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void submitCompanyData()
              }}
              className="flex flex-col gap-5"
            >
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-body">Datos de la empresa</h2>
                <p className="text-sm text-body-muted mt-0.5">
                  Ingresa la razon social y el RIF de tu empresa.
                </p>
              </div>
              <FormField label="Razon Social" required>
                <Input
                  id="onboarding-company-name"
                  placeholder="Mi Empresa C.A."
                  value={companyData.companyName}
                  onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="RIF" required>
                <Input
                  id="onboarding-tax-id"
                  placeholder="J-12345678-9"
                  value={companyData.taxId}
                  onChange={(e) => setCompanyData({ ...companyData, taxId: e.target.value })}
                  required
                />
              </FormField>
              <Button type="submit" isLoading={loading} fullWidth className="mt-2">
                Continuar <ChevronRight className="w-4 h-4" strokeWidth={2} />
              </Button>
            </form>
          )}

          {step === 'domiciliation' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void submitDomiciliation()
              }}
              className="flex flex-col gap-5"
            >
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-body">Domiciliacion bancaria</h2>
                <p className="text-sm text-body-muted mt-0.5">
                  Autoriza el debito inmediato para gestionar los cobros automaticos.
                </p>
              </div>
              <FormField label="Banco" required>
                <Select
                  id="onboarding-bank"
                  options={BANCOS}
                  placeholder="Selecciona un banco"
                  value={domiciliation.bank}
                  onChange={(v) => setDomiciliation({ ...domiciliation, bank: v })}
                />
              </FormField>
              <FormField label="Tipo de cuenta" required>
                <Select
                  id="onboarding-account-type"
                  options={[
                    { value: 'checking', label: 'Corriente' },
                    { value: 'savings', label: 'Ahorro' },
                  ]}
                  value={domiciliation.accountType}
                  onChange={(v) =>
                    setDomiciliation({ ...domiciliation, accountType: v as 'checking' | 'savings' })
                  }
                />
              </FormField>
              <FormField label="Numero de cuenta" required>
                <Input
                  id="onboarding-account-number"
                  placeholder="01340000000000000000"
                  value={domiciliation.accountNumber}
                  onChange={(e) =>
                    setDomiciliation({ ...domiciliation, accountNumber: e.target.value })
                  }
                  required
                />
              </FormField>
              <FormField label="Titular de la cuenta" required>
                <Input
                  id="onboarding-holder-name"
                  placeholder="Nombre completo del titular"
                  value={domiciliation.holderName}
                  onChange={(e) =>
                    setDomiciliation({ ...domiciliation, holderName: e.target.value })
                  }
                  required
                />
              </FormField>
              <FormField label="Cedula del titular" required>
                <Input
                  id="onboarding-holder-id"
                  placeholder="V12345678"
                  value={domiciliation.holderId}
                  onChange={(e) => setDomiciliation({ ...domiciliation, holderId: e.target.value })}
                  required
                />
              </FormField>
              <label
                className="flex items-start gap-3 cursor-pointer group"
                htmlFor="onboarding-authorize"
              >
                <input
                  id="onboarding-authorize"
                  type="checkbox"
                  checked={domiciliation.debitAuthorized}
                  onChange={(e) =>
                    setDomiciliation({ ...domiciliation, debitAuthorized: e.target.checked })
                  }
                  className="mt-0.5 w-5 h-5 rounded border-gray-300 text-secondary focus:ring-secondary"
                />
                <span className="text-sm text-body-secondary leading-relaxed">
                  Autorizo a ElMio a realizar debitos inmediatos a la cuenta indicada para el cobro
                  de los servicios contratados. Acepto los{' '}
                  <span className="text-secondary font-medium">terminos y condiciones</span>.
                </span>
              </label>
              <Button
                type="submit"
                isLoading={loading}
                disabled={!domiciliation.debitAuthorized}
                fullWidth
                className="mt-2"
              >
                Guardar y continuar <ChevronRight className="w-4 h-4" strokeWidth={2} />
              </Button>
            </form>
          )}

          {step === 'payroll' && (
            <PayrollStep
              loading={loading}
              payrollItems={payrollItems}
              setPayrollItems={setPayrollItems}
              submitPayroll={submitPayroll}
              skipPayroll={skipPayroll}
            />
          )}
        </div>
      </div>
    </div>
  )
}

interface PayrollStepProps {
  loading: boolean
  payrollItems: CollaboratorInput[]
  setPayrollItems: (items: CollaboratorInput[]) => void
  submitPayroll: () => Promise<void>
  skipPayroll: () => Promise<void>
}

function PayrollStep({
  loading,
  payrollItems,
  setPayrollItems,
  submitPayroll,
  skipPayroll,
}: PayrollStepProps) {
  const [dragActive, setDragActive] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setParseError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter((l) => l.trim().length > 0)
        if (lines.length < 2) {
          setParseError('El archivo debe tener al menos una fila de datos.')
          return
        }
        const rows = lines.slice(1).map((line) => {
          const cols = line.split(',').map((c) => c.trim())
          if (cols.length < 6) throw new Error(`Fila invalida: "${line}". Se esperan 6 columnas.`)
          return {
            name: cols[0],
            lastName: cols[1],
            documentId: cols[2],
            email: cols[3],
            phone: cols[4],
            baseSalary: parseFloat(cols[5]) || 0,
          } satisfies CollaboratorInput
        })
        setPayrollItems(rows)
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Error al leer archivo.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-body">Carga de nomina</h2>
        <p className="text-sm text-body-muted mt-0.5">
          Sube un archivo CSV con los datos de tus colaboradores. Este paso es{' '}
          <span className="font-medium text-body-secondary">opcional</span>.
        </p>
      </div>
      {parseError && <Alert type="error" message={parseError} />}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer ${dragActive ? 'border-secondary bg-secondary/5 scale-[1.01]' : 'border-gray-200 hover:border-secondary/40 hover:bg-gray-50'}`}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
          <Upload className="w-6 h-6 text-secondary" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-body-secondary text-center">
          <span className="font-medium text-secondary">Haz clic o arrastra</span> un archivo CSV
          aqui
        </p>
        <p className="text-xs text-body-muted">
          Formato: Nombre, Apellido, Cedula, Email, Telefono, SalarioBase
        </p>
      </div>
      {payrollItems.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-body-secondary">
              <Check className="w-4 h-4 inline text-green-500 mr-1" strokeWidth={2} />
              {payrollItems.length} colaboradores detectados
            </p>
            <button
              type="button"
              onClick={() => setPayrollItems([])}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Limpiar
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-body-muted">Nombre</th>
                  <th className="px-3 py-2 text-left font-medium text-body-muted">Apellido</th>
                  <th className="px-3 py-2 text-left font-medium text-body-muted">Cedula</th>
                  <th className="px-3 py-2 text-left font-medium text-body-muted">Email</th>
                </tr>
              </thead>
              <tbody>
                {payrollItems.map((item, idx) => (
                  <tr key={idx} className="border-t border-gray-50">
                    <td className="px-3 py-2 text-body">{item.name}</td>
                    <td className="px-3 py-2 text-body">{item.lastName}</td>
                    <td className="px-3 py-2 text-body-muted">{item.documentId}</td>
                    <td className="px-3 py-2 text-body-muted">{item.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        {payrollItems.length > 0 && (
          <Button type="button" isLoading={loading} fullWidth onClick={() => void submitPayroll()}>
            Subir nomina y finalizar <Check className="w-4 h-4" strokeWidth={2} />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          isLoading={loading}
          fullWidth
          onClick={() => void skipPayroll()}
        >
          <SkipForward className="w-4 h-4" strokeWidth={1.5} />
          Omitir por ahora
        </Button>
      </div>
    </div>
  )
}
