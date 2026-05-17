import { Spinner } from '@/components/atoms/Spinner/Spinner'
import type { ButtonProps } from './Button.d'

/**
 * Componente atomo de boton con variantes primary y ghost.
 * Soporta estado de carga con spinner integrado.
 */
export function Button({
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-secondary text-white hover:bg-secondary-dark focus:ring-ring shadow-sm',
    ghost: 'border border-secondary text-secondary hover:bg-surface-muted focus:ring-ring',
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
