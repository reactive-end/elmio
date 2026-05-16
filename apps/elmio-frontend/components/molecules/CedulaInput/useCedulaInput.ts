'use client'

import { useCallback, useRef, useState } from 'react'
import { z } from 'zod'
import type { CedulaLetter, CedulaValue } from './CedulaInput.d'

const LETTER_OPTIONS: CedulaLetter[] = ['V', 'E', 'G']
const MIN_DIGITS = 7
const MAX_DIGITS = 9

/** Esquema Zod para validar un valor de cedula completo. */
export const cedulaSchema = z.object({
  letter: z.enum(['V', 'E', 'G']),
  digits: z
    .string()
    .regex(/^\d+$/, 'Solo se permiten numeros')
    .refine((v) => v.length >= MIN_DIGITS, `Minimo ${MIN_DIGITS} digitos`)
    .refine((v) => v.length <= MAX_DIGITS, `Maximo ${MAX_DIGITS} digitos`),
})

/**
 * Formatea una cadena de digitos puros en el formato visual de cedula.
 *
 * Ejemplos:
 *   "28502328" → "28 502 328"
 *   "6502328"  → "6 502 328"
 *   "100502328" → "100 502 328"
 *
 * @param raw - Cadena de digitos sin formatear.
 * @returns Cadena con espacios en las posiciones correspondientes.
 */
function formatCedulaDigits(raw: string): string {
  const cleaned = raw.replace(/\D/g, '')
  const total = cleaned.length

  if (total <= 3) return cleaned
  if (total <= 6) {
    const group1 = Math.max(1, total - 3)
    return `${cleaned.slice(0, group1)} ${cleaned.slice(group1)}`
  }

  const firstSize = total - 6
  return `${cleaned.slice(0, firstSize)} ${cleaned.slice(firstSize, firstSize + 3)} ${cleaned.slice(firstSize + 3)}`
}

/**
 * Hook que encapsula la logica de estado y validacion para el componente CedulaInput.
 *
 * @param initial - Valor inicial opcional de la cedula.
 * @returns Estado, manejadores y metadatos necesarios para renderizar el componente.
 */
export function useCedulaInput(initial?: CedulaValue) {
  const [letter, setLetter] = useState<CedulaLetter>(initial?.letter ?? 'V')
  const [displayDigits, setDisplayDigits] = useState(
    initial?.digits ? formatCedulaDigits(initial.digits) : '',
  )
  const inputRef = useRef<HTMLInputElement>(null)

  const rawDigits = displayDigits.replace(/\D/g, '')

  /** Indica si los digitos actuales cumplen con el largo requerido. */
  const isValid = rawDigits.length >= MIN_DIGITS && rawDigits.length <= MAX_DIGITS

  const handleLetterChange = useCallback((next: CedulaLetter) => {
    setLetter(next)
  }, [])

  /**
   * Procesa el cambio en el campo numerico: limpia caracteres no digitos,
   * trunca al maximo permitido y formatea con espacios.
   */
  const handleDigitsChange = useCallback(
    (raw: string) => {
      const cleaned = raw.replace(/\D/g, '').slice(0, MAX_DIGITS)
      const oldFormatted = displayDigits
      const formatted = formatCedulaDigits(cleaned)
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
    letter,
    displayDigits,
    rawDigits,
    isValid,
    inputRef,
    letterOptions: LETTER_OPTIONS,
    handleLetterChange,
    handleDigitsChange,
  } as const
}
