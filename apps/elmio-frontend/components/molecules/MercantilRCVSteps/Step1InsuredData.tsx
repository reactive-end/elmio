/**
 * @fileoverview Componente de Paso 1: Datos del Asegurado.
 * @description Captura los datos básicos del asegurado para la consulta RCV usando CedulaInput y PhoneInput del proyecto.
 * @module components/molecules/MercantilRCVSteps/Step1InsuredData
 */

'use client';

import { User } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { FormField } from '@/components/molecules/FormField/FormField'
import CedulaInput from '@/components/molecules/CedulaInput/CedulaInput'
import { PhoneInput } from '@/components/molecules/PhoneInput/PhoneInput'
import type { InsuredData, PhoneCode } from '@/src/hooks/pages/useMercantilConsultaRCV'

interface Step1InsuredDataProps {
  insured: InsuredData
  setInsured: React.Dispatch<React.SetStateAction<InsuredData>>
  loading: boolean
  errorMessage: string
  onSubmit: (e: React.FormEvent) => Promise<void>
}

export function Step1InsuredData({
  insured,
  setInsured,
  loading,
  errorMessage,
  onSubmit,
}: Step1InsuredDataProps) {
  const phoneDisplay = insured.phoneNumber
    .replace(/^(\d{3})(\d{2})(\d{0,2})$/, '$1 $2 $3')
    .replace(/^(\d{3})(\d{0,2})$/, '$1 $2')
    .trim()

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
          <User className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-body">Datos del Asegurado</h2>
          <p className="text-xs text-body-muted">Ingrese la información personal del titular de la póliza.</p>
        </div>
      </div>

      <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={onSubmit}>
        <FormField label="Nombres" required>
          <Input
            type="text"
            value={insured.firstName}
            onChange={(e) => setInsured((p) => ({ ...p, firstName: e.target.value }))}
            required
          />
        </FormField>
        <FormField label="Apellidos" required>
          <Input
            type="text"
            value={insured.lastName}
            onChange={(e) => setInsured((p) => ({ ...p, lastName: e.target.value }))}
            required
          />
        </FormField>
        <FormField label="Cédula" required>
          <CedulaInput
            value={{ letter: insured.docType as 'V' | 'E' | 'G', digits: insured.docNumber }}
            onChange={(v) =>
              setInsured((p) => ({ ...p, docType: v.letter, docNumber: v.digits }))
            }
            allowedLetters={['V', 'E']}
          />
        </FormField>
        <FormField label="Correo electrónico" required>
          <Input
            type="email"
            value={insured.email}
            onChange={(e) => setInsured((p) => ({ ...p, email: e.target.value }))}
            required
          />
        </FormField>
        <FormField label="Teléfono" required>
          <PhoneInput
            displayValue={phoneDisplay}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 7)
              setInsured((p) => ({ ...p, phoneNumber: raw }))
            }}
            countryCode={{ code: 'VE', dial: '+58', flag: '🇻🇪', name: 'Venezuela' }}
            onCountryCodeChange={() => {}}
            operatorPrefix={insured.phoneCode.slice(1) as '412' | '422' | '414' | '424' | '416' | '426'}
            onOperatorPrefixChange={(prefix) =>
              setInsured((p) => ({ ...p, phoneCode: `0${prefix}` as PhoneCode }))
            }
            hideCountrySelector
          />
        </FormField>
        <FormField label="Fecha de nacimiento" required>
          <Input
            type="date"
            value={insured.birthDate}
            onChange={(e) => setInsured((p) => ({ ...p, birthDate: e.target.value }))}
            required
          />
        </FormField>
        <FormField label="Género" required>
          <Select
            value={insured.genderId}
            onChange={(v) => setInsured((p) => ({ ...p, genderId: v as 'M' | 'F' }))}
            options={[
              { value: 'M', label: 'Masculino' },
              { value: 'F', label: 'Femenino' },
            ]}
          />
        </FormField>
        <div className="sm:col-span-2 flex items-center gap-3 mt-2">
          <Button type="submit" isLoading={loading}>
            {loading ? 'Procesando...' : 'Continuar'}
          </Button>
        </div>
      </form>

      {errorMessage && (
        <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
      )}
    </div>
  )
}
