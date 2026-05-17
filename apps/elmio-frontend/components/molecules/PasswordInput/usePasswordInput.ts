'use client'

import { useState } from 'react'

export interface UsePasswordInputReturn {
  inputType: 'password' | 'text'
  showPassword: boolean
  toggleShow: () => void
}

/**
 * Hook que maneja la visibilidad de la contrasena.
 */
export function usePasswordInput(): UsePasswordInputReturn {
  const [showPassword, setShowPassword] = useState(false)
  const toggleShow = () => setShowPassword((prev) => !prev)

  return {
    inputType: showPassword ? 'text' : 'password',
    showPassword,
    toggleShow,
  }
}
