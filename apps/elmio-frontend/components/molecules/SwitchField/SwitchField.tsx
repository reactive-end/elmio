'use client'

import type { SwitchFieldProps } from './SwitchField.d'

/**
 * Componente molecule de interruptor con etiqueta y descripcion.
 * Combina el atomo Toggle con una etiqueta textual en una tarjeta.
 */
export function SwitchField({ label, checked, onChange }: SwitchFieldProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4">
      <span className="text-xs font-medium text-body">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-secondary' : 'bg-gray-200'}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}
