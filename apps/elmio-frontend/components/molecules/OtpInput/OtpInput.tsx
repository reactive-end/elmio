'use client'

import { useRef, useEffect, type ClipboardEvent, type KeyboardEvent } from 'react'
import type { OtpInputProps } from './OtpInput.d'

/**
 * Componente OtpInput ultra-premium.
 * Renderiza una serie de inputs estilizados para el ingreso de codigos de seguridad.
 * Soporta saltar al siguiente input al escribir, retroceder al borrar,
 * focus inteligente y copiado/pegado fluido de codigos.
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  className = '',
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Sincronizar el valor inicial / cambios externos
  const values = Array.from({ length }, (_, i) => value[i] ?? '')

  // Focus en el primer input al montar
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  // Manejar el cambio individual de caracteres
  const handleChange = (index: number, val: string) => {
    // Tomar solo el ultimo caracter para evitar multiples letras en un input
    const char = val.slice(-1).replace(/\D/g, '') // Solo digitos numericos

    const newValues = [...values]
    newValues[index] = char
    const combinedValue = newValues.join('')
    onChange(combinedValue)

    // Si escribe un caracter y no es el ultimo campo, saltar al siguiente input
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Manejar interaccion de teclas especiales (borrado con Backspace)
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const currentVal = values[index]

      if (!currentVal && index > 0) {
        // Si el campo actual esta vacio y presiona backspace, enfoca el anterior y borra su valor
        const newValues = [...values]
        newValues[index - 1] = ''
        onChange(newValues.join(''))
        inputRefs.current[index - 1]?.focus()
      } else {
        // Si tiene valor, borra el valor del campo actual
        const newValues = [...values]
        newValues[index] = ''
        onChange(newValues.join(''))
      }
    }
  }

  // Manejar pegado de codigo completo (soporte paste)
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (disabled) return

    const pasteData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '') // Solo numeros
      .slice(0, length)

    if (pasteData.length > 0) {
      const newValues = Array.from({ length }, (_, i) => pasteData[i] ?? '')
      onChange(newValues.join(''))

      // Enfocar el ultimo input que recibio caracter o el ultimo del todo
      const focusIndex = Math.min(pasteData.length, length - 1)
      inputRefs.current[focusIndex]?.focus()
    }
  }

  return (
    <div className={`flex justify-center items-center gap-2.5 sm:gap-3.5 ${className}`}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={values[index]}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold rounded-2xl border border-gray-200 bg-gray-50/50 text-gray-900 shadow-sm focus:bg-white focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          autoComplete="one-time-code"
        />
      ))}
    </div>
  )
}
