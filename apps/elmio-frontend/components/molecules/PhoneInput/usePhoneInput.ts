'use client'

import { useState } from 'react'
import type { CountryCode, OperatorPrefix } from './PhoneInput.d'

const COUNTRY_CODES: CountryCode[] = [
  { code: 'VE', dial: '+58', flag: '🇻🇪', name: 'Venezuela' },
  { code: 'CO', dial: '+57', flag: '🇨🇴', name: 'Colombia' },
  { code: 'MX', dial: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'Estados Unidos' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'Espana' },
  { code: 'AR', dial: '+54', flag: '🇦🇷', name: 'Argentina' },
  { code: 'CL', dial: '+56', flag: '🇨🇱', name: 'Chile' },
  { code: 'PE', dial: '+51', flag: '🇵🇪', name: 'Peru' },
]

const OPERATOR_PREFIXES: OperatorPrefix[] = ['412', '422', '414', '424', '416', '426']

export interface UsePhoneInputReturn {
  open: boolean
  countryCodes: CountryCode[]
  operatorPrefixes: OperatorPrefix[]
  toggleOpen: () => void
  handleSelectCountry: (code: CountryCode) => void
}

/**
 * Hook que maneja la logica del selector de pais y prefijo de operadora.
 */
export function usePhoneInput(
  onCountryCodeChange: (code: CountryCode) => void,
): UsePhoneInputReturn {
  const [open, setOpen] = useState(false)

  const toggleOpen = () => setOpen((v) => !v)
  const handleSelectCountry = (code: CountryCode) => {
    onCountryCodeChange(code)
    setOpen(false)
  }

  return {
    open,
    countryCodes: COUNTRY_CODES,
    operatorPrefixes: OPERATOR_PREFIXES,
    toggleOpen,
    handleSelectCountry,
  }
}
