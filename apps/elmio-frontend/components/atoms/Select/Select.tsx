import { ChevronDown } from 'lucide-react'
import type { SelectProps } from './Select.d'

/**
 * Componente atomo de seleccion desplegable.
 * Usa el elemento nativo select con estilos personalizados y un icono chevron.
 */
export function Select({
  options,
  placeholder,
  hasError = false,
  className = '',
  onChange,
  ...props
}: SelectProps) {
  return (
    <div className="relative">
      <select
        className={`w-full appearance-none rounded-xl border px-4 py-3 text-sm text-body transition-all duration-200 outline-none bg-white ${
          hasError
            ? 'border-red-400 focus:ring-2 focus:ring-red-300'
            : 'border-gray-200 focus:border-border-focus focus:ring-2 focus:ring-ring/20'
        } ${className}`}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        strokeWidth={1.5}
      />
    </div>
  )
}
