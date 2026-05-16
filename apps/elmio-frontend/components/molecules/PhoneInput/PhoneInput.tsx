'use client'

import { useEffect } from 'react'
import { usePhoneInput } from './usePhoneInput'
import type { PhoneInputProps, PhoneValue } from './PhoneInput.d'

/**
 * Componente molecule para la entrada de numero de telefono.
 *
 * Estructura visual:
 *   [Select: 0412|0422|...] [Input: 741 36 75]
 *
 * El campo numerico se formatea automaticamente con espacios y acepta
 * exactamente 7 digitos.
 */
export default function PhoneInput({ value, onChange, placeholder }: PhoneInputProps) {
  const {
    code,
    displayDigits,
    rawDigits,
    inputRef,
    codeOptions,
    handleCodeChange,
    handleDigitsChange,
  } = usePhoneInput(value)

  useEffect(() => {
    if (onChange) {
      onChange({ code, digits: rawDigits } satisfies PhoneValue)
    }
  }, [code, rawDigits, onChange])

  return (
    <div className="flex gap-2 items-center">
      <select
        value={code}
        onChange={(e) => handleCodeChange(e.target.value as PhoneValue['code'])}
        className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      >
        {codeOptions.map((opt) => (
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
        placeholder={placeholder ?? '741 36 75'}
        maxLength={EXACT_DIGITS + 2}
        className="h-10 w-full max-w-40 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />
    </div>
  )
}

/** Cantidad exacta de digitos requeridos en el campo numerico. */
const EXACT_DIGITS = 7
