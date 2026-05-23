'use client'

import { useState, useCallback, type FormEvent } from 'react'
import { authService } from '@/src/services/auth.service'

interface AlertState {
  type: 'error' | 'success'
  message: string
}

export interface UseChangePasswordModalReturn {
  newPassword: string
  setNewPassword: (v: string) => void
  confirmPassword: string
  setConfirmPassword: (v: string) => void
  isLoading: boolean
  alert: AlertState | null
  handleSubmit: (e: FormEvent) => void
  onPasswordChanged: () => void
}

/**
 * Hook que encapsula la logica del modal de cambio de contrasena.
 * Valida que las passwords coincidan, tengan minimo 8 caracteres
 * y llama al backend para realizar el cambio.
 */
export function useChangePasswordModal(
  onPasswordChanged: () => void,
): UseChangePasswordModalReturn {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState<AlertState | null>(null)

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setAlert(null)

      if (newPassword.length < 8) {
        setAlert({
          type: 'error',
          message: 'La nueva contrasena debe tener al menos 8 caracteres.',
        })
        return
      }

      if (newPassword !== confirmPassword) {
        setAlert({ type: 'error', message: 'Las contrasenas no coinciden.' })
        return
      }

      try {
        setIsLoading(true)
        await authService.changePassword(newPassword)
        setAlert({ type: 'success', message: 'Contrasena cambiada con exito.' })
        setTimeout(() => {
          onPasswordChanged()
        }, 1500)
      } catch (e) {
        setAlert({
          type: 'error',
          message: e instanceof Error ? e.message : 'Error al cambiar contrasena.',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [newPassword, confirmPassword, onPasswordChanged],
  )

  return {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    alert,
    handleSubmit,
    onPasswordChanged,
  }
}
