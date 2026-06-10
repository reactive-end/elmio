'use client'

import { ShieldOff, X } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import type { BlockedAccessModalProps } from './BlockedAccessModal.d'

/**
 * Modal premium que se muestra cuando el usuario autenticado NO tiene un
 * perfil compatible (CLIENT o EMPLOYEE) asociado a su correo. Le indica
 * que este producto solo puede ser adquirido por clientes naturales o
 * colaboradores y bloquea el avance del flujo de consulta.
 */
export function BlockedAccessModal({ isOpen, onClose }: BlockedAccessModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md transition-all duration-300 animate-fadeIn">
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 transform scale-100 animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
        >
          <X className="h-4.5 w-4.5" strokeWidth={1.5} />
        </button>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 border border-red-100 text-red-500 shadow-sm">
          <ShieldOff className="h-7 w-7" strokeWidth={1.5} />
        </div>

        <div className="text-center">
          <h3 className="text-base font-bold text-body tracking-tight">
            Acceso no disponible
          </h3>
          <p className="mt-2 text-xs font-medium text-body-muted leading-relaxed px-1">
            Este producto solo puede ser adquirido por clientes naturales o colaboradores.
            Tu cuenta actual no tiene un perfil compatible.
          </p>
        </div>

        <div className="mt-6">
          <Button
            type="button"
            onClick={onClose}
            fullWidth
            className="text-xs py-2 h-10"
          >
            Entendido
          </Button>
        </div>
      </div>
    </div>
  )
}
