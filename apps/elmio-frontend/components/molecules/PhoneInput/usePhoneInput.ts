'use client'

import { useCallback, useRef, useState } from 'react'
import { z } from 'zod'
import type { PhoneCode, PhoneValue } from './PhoneInput.d'

const CODE_OPTIONS: PhoneCode[] = ['0412', '0422', '0414', '0424', '0416', '0426']
const EXACT_DIGITS = 7

/** Esquema Zod para validar un valor de telefono completo. */
export const phoneSchema = z.object({
  code: z.enum(['0412', '0422', '0414', '0424', '0416', '0426']),
  digits: z.string().regex(/^\d{7}$/, 'Debe contener exactamente 7 digitos'),
})

/**
 * Formatea una cadena de 7 digitos en el formato visual de telefono.
 *
 * Ejemplo:
 *   "7413675" → "741 36 75"
 *
 * @param raw - Cadena de digitos sin formatear.
 * @returns Cadena con espacios en las posiciones correspondientes.
 */
function formatPhoneDigits(raw: string): string {
  const cleaned = raw.replace(/\D/g, '')
  const total = cleaned.length

  if (total <= 3) return cleaned
  if (total <= 5) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, EXACT_DIGITS)}`
}

/**
 * Hook que encapsula la logica de estado y validacion para el componente PhoneInput.
 *
 * @param initial - Valor inicial opcional del telefono.
 * @returns Estado, manejadores y metadatos necesarios para renderizar el componente.
 */
export function usePhoneInput(initial?: PhoneValue) {
  const [code, setCode] = useState<PhoneCode>(initial?.code ?? '0412')
  const [displayDigits, setDisplayDigits] = useState(
    initial?.digits ? formatPhoneDigits(initial.digits) : '',
  )
  const inputRef = useRef<HTMLInputElement>(null)

  const rawDigits = displayDigits.replace(/\D/g, '')

  /** Indica si los digitos actuales cumplen exactamente con los 7 requeridos. */
  const isValid = rawDigits.length === EXACT_DIGITS

  const handleCodeChange = useCallback((next: PhoneCode) => {
    setCode(next)
  }, [])

  /**
   * Procesa el cambio en el campo numerico: limpia caracteres no digitos,
   * trunca al maximo de 7 y formatea con espacios (XXX XX XX).
   */
  const handleDigitsChange = useCallback(
    (raw: string) => {
      const cleaned = raw.replace(/\D/g, '').slice(0, EXACT_DIGITS)
      const oldFormatted = displayDigits
      const formatted = formatPhoneDigits(cleaned)
      setDisplayDigits(formatted)

      requestAnimationFrame(() => {
        if (!inputRef.current) return
        const cursorPos = inputRef.current.selectionStart ?? 0
        const oldSpaces = oldFormatted.slice(0, cursorPos).split(' ').length - 1
        const newSpaces = formatted.slice(0, cursorPos).split(' ').length - 1
        const adjusted = cursorPos + (newSpaces - oldSpaces)
        inputRef.current.setSelectionRange(adjusted, adjusted)
      })
    },
    [displayDigits],
  )

  return {
    code,
    displayDigits,
    rawDigits,
    isValid,
    inputRef,
    codeOptions: CODE_OPTIONS,
    handleCodeChange,
    handleDigitsChange,
  } as const
}
