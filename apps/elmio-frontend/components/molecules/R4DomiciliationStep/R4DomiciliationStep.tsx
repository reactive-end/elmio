/**
 * @fileoverview Componente de paso de wizard para registrar el acuerdo de domiciliación en cuenta con Banco R4.
 * @description Recoge los datos del titular y de la cuenta de 20 dígitos para domiciliar las cuotas periódicas no anuales de seguros con protección contra doble clic.
 * @module components/molecules/R4DomiciliationStep/R4DomiciliationStep
 */

'use client'

import { useState } from 'react'
import { Landmark, FileText, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Select } from '@/components/atoms/Select/Select'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { FormField } from '@/components/molecules/FormField/FormField'
import { r4PaymentService } from '@/src/services/r4-payment.service'

const VENEZUELAN_BANKS = [
  { code: '0102', label: 'Banco de Venezuela (0102)' },
  { code: '0104', label: 'Banco Venezolano de Crédito (0104)' },
  { code: '0105', label: 'Banco Mercantil (0105)' },
  { code: '0108', label: 'Banco Provincial (0108)' },
  { code: '0114', label: 'Bancaribe (0114)' },
  { code: '0115', label: 'Banco Exterior (0115)' },
  { code: '0128', label: 'Banco Caroní (0128)' },
  { code: '0134', label: 'Banesco (0134)' },
  { code: '0137', label: 'Banco Sofitasa (0137)' },
  { code: '0138', label: 'Banco Plaza (0138)' },
  { code: '0146', label: 'Bangente (0146)' },
  { code: '0151', label: 'Banco Fondo Común (0151)' },
  { code: '0156', label: '100% Banco (0156)' },
  { code: '0157', label: 'DelSur (0157)' },
  { code: '0163', label: 'Banco del Tesoro (0163)' },
  { code: '0166', label: 'Banco Agrícola de Venezuela (0166)' },
  { code: '0168', label: 'Bancrecer (0168)' },
  { code: '0169', label: 'Banco R4 (0169)' },
  { code: '0171', label: 'Banco Activo (0171)' },
  { code: '0172', label: 'Bancamiga (0172)' },
  { code: '0173', label: 'Banco Internacional de Desarrollo (0173)' },
  { code: '0174', label: 'Banplus (0174)' },
  { code: '0175', label: 'Banco Digital de los Trabajadores / Bicentenario (0175)' },
  { code: '0177', label: 'Banfanb (0177)' },
  { code: '0178', label: 'N58 Banco Digital (0178)' },
  { code: '0191', label: 'Banco Nacional de Crédito (0191)' },
]

const DNI_TYPES = [
  { value: 'V', label: 'V' },
  { value: 'E', label: 'E' },
  { value: 'G', label: 'G' },
  { value: 'J', label: 'J' },
]

interface R4DomiciliationStepProps {
  /** Monto de cada cuota individual en USD */
  quotaAmountUsd: number
  /** Tasa de cambio BCV oficial */
  exchangeRate: number
  /** Nombre completo predeterminado del titular */
  defaultHolderName: string
  /** Cédula/RIF predeterminado del titular (ej: V-12345678) */
  defaultHolderDocument?: string
  /** Frecuencia de la cuota en texto (ej: "Mensual", "Trimestral", "Semestral") */
  frequencyLabel: string
  /** Concepto de la domiciliación */
  domiciliationConcept: string
  /** Callback al procesarse exitosamente el acuerdo de domiciliación en R4 */
  onDomiciliationSuccess: (result: { uuid: string; accountNumber: string; bankCode: string }) => void
  /** Callback para volver al paso anterior */
  onBack: () => void
}

export function R4DomiciliationStep({
  quotaAmountUsd,
  exchangeRate,
  defaultHolderName,
  defaultHolderDocument = '',
  frequencyLabel,
  domiciliationConcept,
  onDomiciliationSuccess,
  onBack,
}: R4DomiciliationStepProps) {
  // Parsing del documento de identidad por defecto
  const docTypeMatch = defaultHolderDocument.match(/^([VEGJvegj])[-]?(\d+)$/)
  const parsedDocType = docTypeMatch ? docTypeMatch[1].toUpperCase() : 'V'
  const parsedDocNum = docTypeMatch ? docTypeMatch[2] : defaultHolderDocument.replace(/\D/g, '')

  // Estados de entrada
  const [selectedBank, setSelectedBank] = useState('0102')
  const [accountNumber, setAccountNumber] = useState('')
  const [holderName, setHolderName] = useState(defaultHolderName)
  const [dniType, setDniType] = useState(parsedDocType)
  const [dniNumber, setDniNumber] = useState(parsedDocNum)
  const [authorized, setAuthorized] = useState(false)

  // Estados de carga e idempotencia
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Monto de la cuota en Bs.
  const quotaAmountBs = Number((quotaAmountUsd * exchangeRate).toFixed(2))

  /**
   * Registra el acuerdo de domiciliación en Banco R4.
   * Cuenta con protección preventiva contra doble clic.
   */
  const handleProcessDomiciliation = async () => {
    // Bloqueo lógico por idempotencia
    if (isSubmitting) return

    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const fullDoc = `${dniType}${dniNumber}`

      if (!holderName.trim()) {
        throw new Error('Debe indicar el nombre completo del titular de la cuenta.')
      }

      if (accountNumber.length !== 20 || !/^\d+$/.test(accountNumber)) {
        throw new Error('El número de cuenta debe contener exactamente 20 dígitos numéricos.')
      }

      if (!dniNumber || !/^\d+$/.test(dniNumber)) {
        throw new Error('El documento de identidad ingresado no es válido.')
      }

      if (!authorized) {
        throw new Error('Debe autorizar explícitamente el débito automático de sus cuotas en cuenta.')
      }

      const res = await r4PaymentService.directDebitAccount({
        companyAccountId: 'GLOBAL_R4_FALLBACK',
        documentId: fullDoc,
        fullName: holderName,
        accountNumber: accountNumber,
        amount: quotaAmountBs,
        concept: domiciliationConcept,
      })

      // Código de éxito en mandato de domiciliación CCE: 202
      if (res.code !== '202') {
        throw new Error(res.message || 'No fue posible registrar la domiciliación de la cuenta en el banco.')
      }

      onDomiciliationSuccess({
        uuid: res.uuid || `DOM-${Date.now()}`,
        accountNumber: accountNumber,
        bankCode: selectedBank,
      })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al registrar la domiciliación. Intente de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
          <Landmark className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-body">Domiciliación de Cuotas</h2>
          <p className="text-xs text-body-muted">
            Configure el débito automático periódico en su cuenta bancaria para los pagos fraccionados.
          </p>
        </div>
      </div>

      {/* Resumen del Plan Fraccionado */}
      <div className="bg-surface-muted/40 border border-gray-100 rounded-2xl p-5 flex flex-col gap-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-body-muted">Frecuencia de cargo</span>
          <span className="font-semibold text-body">{frequencyLabel}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-body-muted">Cuota estimada (USD)</span>
          <span className="font-semibold text-body">${quotaAmountUsd.toFixed(2)} / cuota</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-body-muted font-medium">Tasa aplicada (BCV)</span>
          <span className="text-body-muted font-mono">Bs. {exchangeRate.toFixed(4)}</span>
        </div>
        <div className="h-px bg-gray-100 my-1" />
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-body">Monto por Cuota (Bs.)</span>
          <span className="text-lg font-bold text-secondary">Bs. {quotaAmountBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex flex-col gap-5">
        <FormField label="Nombre Completo del Titular de la Cuenta" required>
          <Input
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            placeholder="Ej: Juan Pérez"
            disabled={isSubmitting}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Banco de la Cuenta" required>
            <Select
              value={selectedBank}
              onChange={setSelectedBank}
              options={VENEZUELAN_BANKS.map((b) => ({ value: b.code, label: b.label }))}
              placeholder="Seleccione banco"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label="Documento del Titular" required>
            <div className="flex gap-2">
              <Select
                value={dniType}
                onChange={setDniType}
                options={DNI_TYPES}
                className="w-20"
                disabled={isSubmitting}
              />
              <Input
                value={dniNumber}
                onChange={(e) => setDniNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej: 12345678"
                disabled={isSubmitting}
              />
            </div>
          </FormField>
        </div>

        <FormField label="Número de Cuenta (20 dígitos)" required>
          <Input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 20))}
            placeholder="0102XXXXXXXXXXXXXXXX"
            maxLength={20}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Autorización */}
        <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex gap-3">
          <div className="pt-0.5">
            <input
              id="domiciliation-auth-check"
              type="checkbox"
              checked={authorized}
              onChange={(e) => setAuthorized(e.target.checked)}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary cursor-pointer"
            />
          </div>
          <label htmlFor="domiciliation-auth-check" className="text-xs text-body-muted cursor-pointer leading-normal">
            <span className="font-semibold text-body">Autorización Expresa:</span> Autorizo expresamente a ElMio a domiciliar los cargos periódicos del seguro en la cuenta bancaria de 20 dígitos indicada en este formulario.
          </label>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex gap-2 items-center">
            <span className="font-semibold">Error:</span> {errorMsg}
          </div>
        )}

        {/* Controles del Paso */}
        <div className="flex gap-3 border-t border-gray-100 pt-5 mt-4">
          <Button type="button" variant="ghost" fullWidth onClick={onBack} disabled={isSubmitting}>
            Anterior
          </Button>
          <Button
            type="button"
            fullWidth
            disabled={accountNumber.length !== 20 || !holderName.trim() || !dniNumber || !authorized}
            isLoading={isSubmitting}
            onClick={handleProcessDomiciliation}
          >
            Registrar y Autorizar
          </Button>
        </div>

        <div className="flex justify-center items-center gap-1.5 text-[10px] text-body-muted mt-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>Configurado con el estándar de mandatos electrónicos del Banco Central.</span>
        </div>
      </div>
    </div>
  )
}
