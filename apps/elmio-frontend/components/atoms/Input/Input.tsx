import type { InputProps } from './Input.d'

/**
 * Componente atomo de campo de texto.
 * Soporta estado de error con estilos visuales diferenciados.
 */
export function Input({ hasError = false, className = '', ...props }: InputProps) {
  return (
    <input
      className={`
        w-full rounded-xl border px-4 py-3 text-sm
        text-body placeholder:text-gray-400
        transition-all duration-200 outline-none
        ${
          hasError
            ? 'border-red-400 focus:ring-2 focus:ring-red-300'
            : 'border-gray-200 focus:border-border-focus focus:ring-2 focus:ring-ring/20'
        }
        ${className}
      `}
      {...props}
    />
  )
}
