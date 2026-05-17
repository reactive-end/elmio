'use client'

import { Eye, EyeOff } from 'lucide-react'
import { usePasswordInput } from './usePasswordInput'
import { Input } from '@/components/atoms/Input/Input'
import type { PasswordInputProps } from './PasswordInput.d'

/**
 * Componente molecule de campo de contrasena con toggle de visibilidad.
 */
export function PasswordInput({ hasError, className = '', ...props }: PasswordInputProps) {
  const { inputType, showPassword, toggleShow } = usePasswordInput()

  return (
    <div className="relative">
      <Input type={inputType} hasError={hasError} className={`pr-12 ${className}`} {...props} />
      <button
        type="button"
        onClick={toggleShow}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary transition-colors duration-200 focus:outline-none"
        aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" strokeWidth={1.5} />
        ) : (
          <Eye className="w-5 h-5" strokeWidth={1.5} />
        )}
      </button>
    </div>
  )
}
