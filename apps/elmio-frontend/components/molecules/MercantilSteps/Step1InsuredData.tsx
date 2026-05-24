/**
 * @fileoverview Componente de Paso 1: Datos del Asegurado.
 * @description Permite el ingreso de datos básicos del cliente y realiza la consulta inicial de elegibilidad.
 * @module components/molecules/MercantilSteps/Step1InsuredData
 */

'use client'

import { type FormEvent, useMemo } from 'react'
import { User } from 'lucide-react'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { Button } from '@/components/atoms/Button/Button'
import { FormField } from '@/components/molecules/FormField/FormField'
import { Alert } from '@/components/atoms/Alert/Alert'
import CedulaInput from '@/components/molecules/CedulaInput/CedulaInput'
import { PhoneInput } from '@/components/molecules/PhoneInput/PhoneInput'
import type { CountryCode, OperatorPrefix } from '@/components/molecules/PhoneInput/PhoneInput.d'
import { type CedulaValue } from '@/components/molecules/CedulaInput/CedulaInput.d'
import { type InsuredData } from '@/src/hooks/pages/useMercantilConsulta'
import { type MercantilGender } from '@/src/services/mercantil.service'
import { formatPhoneDisplay, stripPhoneFormat } from '@/src/utils/phoneFormat'

interface Step1InsuredDataProps {
  /** Estado de los datos del asegurado */
  insured: InsuredData
  /** Función para actualizar el estado del asegurado */
  setInsured: React.Dispatch<React.SetStateAction<InsuredData>>
  /** Indicador de carga de la consulta */
  loading: boolean
  /** Mensaje de error general si la consulta falla */
  errorMessage: string
  /** Función para limpiar el mensaje de error */
  setErrorMessage: (msg: string) => void
  /** Manejador del submit del formulario */
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>
}

const DEFAULT_COUNTRY: CountryCode = {
  code: 'VE',
  dial: '+58',
  flag: '🇻🇪',
  name: 'Venezuela',
}

export function Step1InsuredData({
  insured,
  setInsured,
  loading,
  errorMessage,
  setErrorMessage,
  onSubmit,
}: Step1InsuredDataProps) {
  const phoneDisplay = useMemo(() => formatPhoneDisplay(insured.phoneNumber), [insured.phoneNumber])

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
          <User className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-body">Datos del Asegurado</h2>
          <p className="text-xs text-body-muted">
            Ingrese su información personal básica para consultar los planes de seguros elegibles.
          </p>
        </div>
      </div>

      {errorMessage && (
        <Alert type="error" message={errorMessage} onDismiss={() => setErrorMessage('')} />
      )}

      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormField label="Nombre" required>
            <Input
              value={insured.firstName}
              onChange={(e) => setInsured((prev) => ({ ...prev, firstName: e.target.value }))}
              placeholder="Ej: Juan"
            />
          </FormField>

          <FormField label="Apellido" required>
            <Input
              value={insured.lastName}
              onChange={(e) => setInsured((prev) => ({ ...prev, lastName: e.target.value }))}
              placeholder="Ej: Perez"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormField label="Cédula de identidad" required>
            <CedulaInput
              value={{
                letter: insured.docType as CedulaValue['letter'],
                digits: insured.docNumber,
              }}
              allowedLetters={['V', 'E']}
              onChange={(value) =>
                setInsured((prev) => ({
                  ...prev,
                  docType: value.letter,
                  docNumber: value.digits,
                }))
              }
              placeholder="12 345 678"
            />
          </FormField>

          <FormField label="Teléfono" required>
            <PhoneInput
              displayValue={phoneDisplay}
              onChange={(e) =>
                setInsured((prev) => ({
                  ...prev,
                  phoneNumber: stripPhoneFormat(e.target.value).slice(0, 7),
                }))
              }
              countryCode={DEFAULT_COUNTRY}
              onCountryCodeChange={() => undefined}
              operatorPrefix={insured.phoneCode.replace(/^0/, '') as OperatorPrefix}
              onOperatorPrefixChange={(prefix) =>
                setInsured((prev) => ({
                  ...prev,
                  phoneCode: `0${prefix}` as InsuredData['phoneCode'],
                }))
              }
              hideCountrySelector
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormField label="Correo Electrónico" required>
            <Input
              type="email"
              value={insured.email}
              onChange={(e) => setInsured((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="juan.perez@ejemplo.com"
            />
          </FormField>

          <FormField label="Fecha de Nacimiento" required>
            <Input
              type="date"
              value={insured.birthDate}
              onChange={(e) => setInsured((prev) => ({ ...prev, birthDate: e.target.value }))}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormField label="Género" required>
            <Select
              value={insured.genderId}
              onChange={(v) => setInsured((prev) => ({ ...prev, genderId: v as MercantilGender }))}
              options={[
                { value: 'M', label: 'Masculino' },
                { value: 'F', label: 'Femenino' },
              ]}
            />
          </FormField>

          <div className="hidden lg:block" />
        </div>

        <div className="border-t border-gray-100 pt-5 mt-2 flex justify-end">
          <Button type="submit" isLoading={loading} className="w-full sm:w-auto">
            Consultar planes
          </Button>
        </div>
      </form>
    </div>
  )
}
