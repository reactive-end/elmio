'use client'

import { UserCircle, X } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import type { ProfileSummary, ProfileSelectorModalProps } from './ProfileSelectorModal.d'

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Cliente',
  EMPLOYEE: 'Colaborador',
  ADMIN: 'Administrador',
  COMPANY: 'Empresa',
  FINANCE: 'Finanzas',
  ALLIED: 'Aliado',
}

/**
 * Modal premium para que el usuario elija uno de los perfiles compatibles
 * (CLIENT o EMPLOYEE) asociados a su correo electronico o a su sesion actual.
 *
 * Se muestra en dos casos:
 * - `reason: 'multi'`: la sesion actual es compatible pero el correo tiene
 *   multiples perfiles compatibles; el usuario debe elegir.
 * - `reason: 'role_mismatch'`: la sesion actual es incompatible (ADMIN,
 *   COMPANY, FINANCE, ALLIED) y el correo tiene perfiles compatibles.
 */
export function ProfileSelectorModal({
  isOpen,
  profiles,
  reason,
  isLoading = false,
  onSelect,
  onClose,
}: ProfileSelectorModalProps) {
  if (!isOpen) return null

  const title = reason === 'multi' ? 'Selecciona tu perfil' : 'Tu cuenta tiene perfiles compatibles'
  const description =
    reason === 'multi'
      ? 'Encontramos varios perfiles asociados a tu cuenta. Elige con cuál deseas continuar esta compra.'
      : 'Tu cuenta actual no es compatible con este producto, pero detectamos perfiles compatibles. Selecciona uno para continuar.'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md transition-all duration-300 animate-fadeIn">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 transform scale-100 animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          disabled={isLoading}
        >
          <X className="h-4.5 w-4.5" strokeWidth={1.5} />
        </button>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 border border-secondary/20 text-secondary shadow-sm">
          <UserCircle className="h-7 w-7" strokeWidth={1.5} />
        </div>

        <div className="text-center">
          <h3 className="text-base font-bold text-body tracking-tight">{title}</h3>
          <p className="mt-2 text-xs font-medium text-body-muted leading-relaxed px-1">
            {description}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {profiles.map((profile: ProfileSummary) => {
            const roleLabel = ROLE_LABELS[profile.role] ?? profile.role
            return (
              <button
                key={profile.userId}
                type="button"
                onClick={() => void onSelect(profile)}
                disabled={isLoading}
                className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-all duration-200 hover:border-secondary/40 hover:bg-secondary/[0.03] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50 cursor-pointer"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-secondary transition-colors duration-200 group-hover:border-secondary/25 group-hover:bg-secondary/10">
                  <UserCircle className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-body">
                    {profile.name || 'Perfil'}
                  </p>
                  <p className="mt-0.5 text-xs text-body-muted">{roleLabel}</p>
                </div>
                <svg
                  className="h-4 w-4 shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )
          })}
        </div>

        <div className="mt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            fullWidth
            className="text-xs py-2 h-10 border-gray-200"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}
