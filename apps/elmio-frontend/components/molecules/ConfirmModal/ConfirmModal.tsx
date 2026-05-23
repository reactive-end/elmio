'use client'

import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  description = 'Esta acción no se puede deshacer. ¿Deseas continuar con la eliminación?',
  confirmText = 'Sí, eliminar',
  cancelText = 'Cancelar',
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md transition-all duration-300 animate-fadeIn">
      <div 
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 transform scale-100 animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Botón de cerrar discreto */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          disabled={isLoading}
        >
          <X className="h-4.5 w-4.5" strokeWidth={1.5} />
        </button>

        {/* Icono circular de Advertencia tipo SweetAlert */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 border border-amber-100 text-amber-500 shadow-sm animate-pulse">
          <AlertTriangle className="h-7 w-7" strokeWidth={1.5} />
        </div>

        {/* Textos */}
        <div className="text-center">
          <h3 className="text-base font-bold text-body tracking-tight">
            {title}
          </h3>
          <p className="mt-2 text-xs font-medium text-body-muted leading-relaxed px-1">
            {description}
          </p>
        </div>

        {/* Acciones */}
        <div className="mt-6 flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 hover:bg-gray-50 text-xs py-2 h-10 border-gray-200"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={() => void onConfirm()}
            isLoading={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 border-red-600 text-white text-xs py-2 h-10 shadow-lg shadow-red-600/10"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
