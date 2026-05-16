'use client'

import { useEffect } from 'react'
import { useCedulaInput } from './useCedulaInput'
import type { CedulaInputProps, CedulaValue } from './CedulaInput.d'

/**
 * Componente molecule para la entrada de cedula de identidad.
 *
 * Estructura visual:
 *   [Select: V|E|G] [Input: 28 502 328]
 *
 * El campo numerico se formatea automaticamente con espacios segun la cantidad
 * de digitos ingresados (minimo 7, maximo 9).
 */
export default function CedulaInput({ value, onChange, placeholder }: CedulaInputProps) {
  const {
    letter,
    displayDigits,
    rawDigits,
    inputRef,
    letterOptions,
    handleLetterChange,
    handleDigitsChange,
  } = useCedulaInput(value)

  useEffect(() => {
    if (onChange) {
      onChange({ letter, digits: rawDigits } satisfies CedulaValue)
    }
  }, [letter, rawDigits, onChange])

  return (
    <div className="flex gap-2 items-center">
      <select
        value={letter}
        onChange={(e) => handleLetterChange(e.target.value as CedulaValue['letter'])}
        className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      >
        {letterOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={displayDigits}
        onChange={(e) => handleDigitsChange(e.target.value)}
        placeholder={placeholder ?? '28 502 328'}
        maxLength={MAX_DIGITS + 2}
        className="h-10 w-full max-w-44 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />
    </div>
  )
}

/** Re-exportado para conveniencia del hook. */
const MAX_DIGITS = 9
