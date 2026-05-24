'use client'

import { useEffect, useRef } from 'react'
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
 * Ambos elementos ocupan el ancho completo y comparten los estilos del sistema.
 */
export default function CedulaInput({
  value,
  onChange,
  placeholder,
  allowedLetters,
}: CedulaInputProps) {
  const {
    letter,
    displayDigits,
    rawDigits,
    inputRef,
    letterOptions,
    handleLetterChange,
    handleDigitsChange,
  } = useCedulaInput(value, allowedLetters)

  /** Ref estable a onChange para romper el ciclo de dependencias en el efecto. */
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    onChangeRef.current?.({ letter, digits: rawDigits } satisfies CedulaValue)
  }, [letter, rawDigits])

  const baseSelect =
    'rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-body transition-all duration-200 outline-none focus:border-border-focus focus:ring-2 focus:ring-ring/20'

  const baseInput =
    'rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-body placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-border-focus focus:ring-2 focus:ring-ring/20'

  return (
    <div className="flex gap-2 w-full">
      <select
        value={letter}
        onChange={(e) => handleLetterChange(e.target.value as CedulaValue['letter'])}
        className={`${baseSelect} w-20 flex-shrink-0 appearance-none`}
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
        className={`${baseInput} flex-1 min-w-0`}
      />
    </div>
  )
}

/** Re-exportado para conveniencia del hook. */
const MAX_DIGITS = 9
