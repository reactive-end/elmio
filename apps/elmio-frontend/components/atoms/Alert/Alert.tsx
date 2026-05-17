import { XCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import type { AlertProps } from './Alert.d'

const styles = {
  error: {
    container: 'bg-[#fef2f2] border-l-4 border-[#ef4444]',
    text: 'text-[#991b1b]',
    icon: 'text-[#ef4444]',
  },
  success: {
    container: 'bg-[#f0fdf4] border-l-4 border-[#22c55e]',
    text: 'text-[#166534]',
    icon: 'text-[#22c55e]',
  },
  warning: {
    container: 'bg-[#fffbeb] border-l-4 border-[#f59e0b]',
    text: 'text-[#92400e]',
    icon: 'text-[#f59e0b]',
  },
  info: {
    container: 'bg-surface-muted border-l-4 border-secondary',
    text: 'text-body-secondary',
    icon: 'text-secondary',
  },
}

const iconMap = {
  error: XCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
}

/**
 * Componente atomo de alerta con 4 variantes.
 * Muestra icono, mensaje y boton opcional para descartar.
 */
export function Alert({ type, message, onDismiss }: AlertProps) {
  const s = styles[type]
  const IconComponent = iconMap[type]

  return (
    <div className={`${s.container} rounded-xl p-4 flex items-start gap-3`} role="alert">
      <IconComponent className={`w-5 h-5 flex-shrink-0 ${s.icon}`} strokeWidth={1.5} />
      <p className={`${s.text} text-sm flex-1 leading-relaxed`}>{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`${s.icon} hover:opacity-70 transition-opacity flex-shrink-0`}
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      )}
    </div>
  )
}
