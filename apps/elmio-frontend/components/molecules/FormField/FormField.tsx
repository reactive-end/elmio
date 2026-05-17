import { AlertCircle } from 'lucide-react'
import type { FormFieldProps } from './FormField.d'

/**
 * Componente molecule que envuelve un campo de formulario
 * con etiqueta, indicador de requerido y mensaje de error.
 */
export function FormField({ label, error, children, required = false }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-body-secondary">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
          {error}
        </p>
      )}
    </div>
  )
}
