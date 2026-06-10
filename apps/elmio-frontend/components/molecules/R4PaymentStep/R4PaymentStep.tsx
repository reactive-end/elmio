/**
 * @fileoverview Componente de paso de wizard para procesar el pago mediante Débito Inmediato (C2P) de Banco R4.
 * @description Maneja la solicitud de OTP interbancaria y formalización del cargo C2P con mecanismos estrictos de idempotencia para prevenir el doble clic.
 * @module components/molecules/R4PaymentStep/R4PaymentStep
 */

'use client'

import { useState } from 'react'
import { Landmark, Phone, CreditCard, ShieldCheck } from 'lucide-react'
import { Select } from '@/components/atoms/Select/Select'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { FormField } from '@/components/molecules/FormField/FormField'
import { OtpInput } from '@/components/molecules/OtpInput/OtpInput'
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

const PHONE_CODES = ['0412', '0422', '0414', '0424', '0426'] as const
type PhoneCode = (typeof PHONE_CODES)[number]

const DNI_TYPES = [
  { value: 'V', label: 'V' },
  { value: 'E', label: 'E' },
  { value: 'G', label: 'G' },
  { value: 'J', label: 'J' },
]

interface R4PaymentStepProps {
  /** Monto en USD a cobrar */
  amountUsd: number
  /** Tasa de cambio BCV oficial */
  exchangeRate: number
  /** Nombre completo predeterminado del pagador */
  defaultPayerName: string
  /** Cédula/RIF predeterminado del pagador (ej: V-12345678 o sólo números) */
  defaultPayerDocument?: string
  /** Teléfono celular predeterminado del pagador (código + número, ej: 04121234567) */
  defaultPayerPhone?: string
  /** Concepto del pago */
  paymentConcept: string
  /** Callback al procesarse exitosamente el pago en R4 */
  onPaymentSuccess: (result: { reference: string; transactionId: string; bankCode: string }) => void
  /** Callback para volver al paso anterior */
  onBack: () => void
}

export function R4PaymentStep({
  amountUsd,
  exchangeRate,
  defaultPayerName,
  defaultPayerDocument = '',
  defaultPayerPhone = '',
  paymentConcept,
  onPaymentSuccess,
  onBack,
}: R4PaymentStepProps) {
  // Parsing del documento de identidad por defecto
  const docTypeMatch = defaultPayerDocument.match(/^([VEGJvegj])[-]?(\d+)$/)
  const parsedDocType = docTypeMatch ? docTypeMatch[1].toUpperCase() : 'V'
  const parsedDocNum = docTypeMatch ? docTypeMatch[2] : defaultPayerDocument.replace(/\D/g, '')

  // Parsing del teléfono por defecto
  const phoneMatch = defaultPayerPhone.replace(/\D/g, '').match(/^(04\d{2})(\d{7})$/)
  const parsedPhoneCode = phoneMatch ? (phoneMatch[1] as PhoneCode) : '0412'
  const parsedPhoneNum = phoneMatch ? phoneMatch[2] : defaultPayerPhone.replace(/\D/g, '').slice(-7)

  // Estados del Formulario
  const [selectedBank, setSelectedBank] = useState('0102')
  const [accountNumber, setAccountNumber] = useState('')
  const [dniType, setDniType] = useState(parsedDocType)
  const [dniNumber, setDniNumber] = useState(parsedDocNum)
  const [phoneCode, setPhoneCode] = useState<PhoneCode>(parsedPhoneCode)
  const [phoneNumber, setPhoneNumber] = useState(parsedPhoneNum)
  const [otpValue, setOtpValue] = useState('')

  // Estados de carga e idempotencia
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [otpRequested, setOtpRequested] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Monto en Bolívares
  const amountBs = Number((amountUsd * exchangeRate).toFixed(2))

  /**
   * Solicita el código OTP interbancaria de Banco R4.
   * Cuenta con protección preventiva contra doble clic.
   */
  const handleRequestOtp = async () => {
    // Bloqueo lógico por idempotencia
    if (isRequestingOtp || isSubmitting) return

    setIsRequestingOtp(true)
    setErrorMsg('')

    try {
      const fullPhone = `${phoneCode}${phoneNumber}`
      const fullDoc = `${dniType}${dniNumber}`

      if (accountNumber.length !== 20 || !/^\d+$/.test(accountNumber)) {
        throw new Error('El número de cuenta bancaria debe contener exactamente 20 dígitos numéricos.')
      }

      if (phoneNumber.length !== 7 || !/^\d+$/.test(phoneNumber)) {
        throw new Error('El número de teléfono móvil debe contener exactamente 7 dígitos.')
      }

      if (!dniNumber || !/^\d+$/.test(dniNumber)) {
        throw new Error('La cédula ingresada no es válida.')
      }

      const res = await r4PaymentService.generateOtp({
        companyAccountId: 'GLOBAL_R4_FALLBACK',
        bankCode: selectedBank,
        amount: amountBs,
        phoneNumber: fullPhone,
        nationalId: fullDoc,
      })

      if (res.success) {
        setOtpRequested(true)
      } else {
        throw new Error(res.message || 'Error al generar el código OTP.')
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al solicitar el código OTP. Intente de nuevo.')
    } finally {
      setIsRequestingOtp(false)
    }
  }

  /**
   * Formaliza el débito inmediato C2P una vez ingresado el OTP.
   * Cuenta con protección preventiva contra doble clic.
   */
  const handleProcessPayment = async () => {
    // Bloqueo lógico por idempotencia
    if (isSubmitting || isRequestingOtp) return

    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const fullPhone = `${phoneCode}${phoneNumber}`
      const fullDoc = `${dniType}${dniNumber}`

      if (otpValue.length !== 8 || !/^\d+$/.test(otpValue)) {
        throw new Error('El código OTP/C2P debe tener exactamente 8 dígitos.')
      }

      const immediateDebitRes = await r4PaymentService.immediateDebit({
        companyAccountId: 'GLOBAL_R4_FALLBACK',
        bankCode: selectedBank,
        amount: amountBs,
        phoneNumber: fullPhone,
        nationalId: fullDoc,
        fullName: defaultPayerName,
        otp: otpValue,
        concept: paymentConcept,
      })

      // Códigos de aceptación de R4: ACCP (Accepted) o AC00 (Success)
      if (immediateDebitRes.code !== 'ACCP' && immediateDebitRes.code !== 'AC00') {
        throw new Error(immediateDebitRes.message || 'La operación de débito inmediato fue rechazada por el banco.')
      }

      // Invocar callback de éxito con la referencia
      onPaymentSuccess({
        reference: immediateDebitRes.reference || `REF-${Date.now().toString().slice(-6)}`,
        transactionId: immediateDebitRes.id || `TRX-${Date.now()}`,
        bankCode: selectedBank,
      })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al procesar el pago. Intente de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
          <CreditCard className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-body">Pago por Débito Inmediato (C2P)</h2>
          <p className="text-xs text-body-muted">
            Autorice el pago al instante a través de la red C2P interbancaria de Banco R4.
          </p>
        </div>
      </div>

      {/* Resumen del Monto */}
      <div className="bg-surface-muted/40 border border-gray-100 rounded-2xl p-5 flex flex-col gap-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-body-muted">Monto total (USD)</span>
          <span className="font-semibold text-body">${amountUsd.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-body-muted">Tasa de cambio (BCV)</span>
          <span className="font-medium text-body-muted">Bs. {exchangeRate.toFixed(4)}</span>
        </div>
        <div className="h-px bg-gray-100 my-1" />
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-body">Monto a debitar (Bs.)</span>
          <span className="text-xl font-bold text-secondary">Bs. {amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Banco de Origen (Pago Móvil)" required>
            <Select
              value={selectedBank}
              onChange={setSelectedBank}
              options={VENEZUELAN_BANKS.map((b) => ({ value: b.code, label: b.label }))}
              placeholder="Seleccione banco"
              disabled={otpRequested || isSubmitting}
            />
          </FormField>

          <FormField label="Documento de Identidad" required>
            <div className="flex gap-2">
              <Select
                value={dniType}
                onChange={setDniType}
                options={DNI_TYPES}
                className="w-20"
                disabled={otpRequested || isSubmitting}
              />
              <Input
                value={dniNumber}
                onChange={(e) => setDniNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej: 12345678"
                disabled={otpRequested || isSubmitting}
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
            disabled={otpRequested || isSubmitting}
          />
        </FormField>

        <FormField label="Teléfono Afiliado a Pago Móvil" required>
          <div className="flex gap-2">
            <Select
              value={phoneCode}
              onChange={(v) => setPhoneCode(v as PhoneCode)}
              options={PHONE_CODES.map((c) => ({ value: c, label: c }))}
              className="w-28"
              disabled={otpRequested || isSubmitting}
            />
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 7))}
              placeholder="1234567"
              maxLength={7}
              disabled={otpRequested || isSubmitting}
            />
          </div>
        </FormField>

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex gap-2 items-center">
            <span className="font-semibold">Error:</span> {errorMsg}
          </div>
        )}

        {/* Sección de OTP */}
        {!otpRequested ? (
          <div className="flex gap-3 border-t border-gray-100 pt-5 mt-4">
            <Button type="button" variant="ghost" fullWidth onClick={onBack} disabled={isRequestingOtp}>
              Anterior
            </Button>
            <Button
              type="button"
              fullWidth
              disabled={accountNumber.length !== 20 || phoneNumber.length !== 7 || !dniNumber}
              isLoading={isRequestingOtp}
              onClick={handleRequestOtp}
            >
              Solicitar Código OTP
            </Button>
          </div>
        ) : (
          <div className="border-t border-gray-100 pt-5 mt-4 flex flex-col gap-4 animate-slideDown">
            <div className="flex flex-col gap-2 items-center text-center">
              <span className="text-sm font-semibold text-body">Código de Seguridad OTP</span>
              <p className="text-xs text-body-muted max-w-sm">
                Ingrese el código temporal de 8 dígitos enviado por su banco para autorizar la transacción.
              </p>
            </div>

            <div className="py-2">
              <OtpInput
                length={8}
                value={otpValue}
                onChange={setOtpValue}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-3 mt-2">
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => {
                  setOtpRequested(false)
                  setOtpValue('')
                  setErrorMsg('')
                }}
                disabled={isSubmitting}
              >
                Modificar Datos
              </Button>
              <Button
                type="button"
                fullWidth
                disabled={otpValue.length !== 8}
                isLoading={isSubmitting}
                onClick={handleProcessPayment}
              >
                Confirmar y Pagar
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-center items-center gap-1.5 text-[10px] text-body-muted mt-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Pago seguro encriptado por la red interbancaria.</span>
        </div>
      </div>
    </div>
  )
}
