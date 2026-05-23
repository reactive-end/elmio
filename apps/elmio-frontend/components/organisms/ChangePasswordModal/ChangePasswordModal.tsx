'use client'

import { Key, Shield } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Alert } from '@/components/atoms/Alert/Alert'
import { FormField } from '@/components/molecules/FormField/FormField'
import { useChangePasswordModal } from './useChangePasswordModal'
import type { ChangePasswordModalProps } from './ChangePasswordModal.d'

/**
 * Modal obligatorio de cambio de contrasena.
 * Se muestra cuando el usuario tiene el flag requirePasswordChange activo
 * y bloquea el acceso al dashboard hasta que la contrasena sea cambiada.
 */
export function ChangePasswordModal({ onPasswordChanged }: ChangePasswordModalProps) {
  const {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    alert,
    handleSubmit,
  } = useChangePasswordModal(onPasswordChanged)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-secondary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Primer inicio de sesion
              </p>
              <h3 className="text-lg font-semibold text-body">Cambia tu contrasena</h3>
            </div>
          </div>
          <p className="mt-2 text-sm text-body-muted">
            Por seguridad, define una nueva contrasena antes de acceder al sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {alert && <Alert type={alert.type} message={alert.message} />}

          <FormField label="Nueva contrasena" required>
            <Input
              type="password"
              placeholder="Minimo 8 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </FormField>

          <FormField label="Confirmar nueva contrasena" required>
            <Input
              type="password"
              placeholder="Repite la nueva contrasena"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </FormField>
        </form>

        <div className="border-t border-gray-100 px-6 py-4">
          <Button type="submit" isLoading={isLoading} fullWidth onClick={handleSubmit}>
            <Key className="w-4 h-4" strokeWidth={2} />
            Cambiar contrasena
          </Button>
        </div>
      </div>
    </div>
  )
}
