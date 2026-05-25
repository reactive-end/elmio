'use client'

import { useState } from 'react'
import { formatPhoneDisplay, stripPhoneFormat } from '@/src/utils/phoneFormat'

export interface UsePhoneFormatReturn {
  displayValue: string
  rawDigits: string
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  setRawDigits: (digits: string) => void
}

/**
 * Hook compartido que maneja el formateo visual de un numero de telefono.
 * Almacena los digitos puros internamente y expone el valor formateado.
 */
export function usePhoneFormat(initialValue = ''): UsePhoneFormatReturn {
  const [rawDigits, setRawDigits] = useState(initialValue)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = stripPhoneFormat(e.target.value).slice(0, 7)
    setRawDigits(digits)
  }

  return {
    displayValue: formatPhoneDisplay(rawDigits),
    rawDigits,
    handleChange,
    setRawDigits,
  }
}
