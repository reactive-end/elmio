'use client'

import type { CardGroupProps } from './CardGroup.d'

/**
 * Componente molecule de tarjeta agrupadora con titulo e icono.
 * Usado para agrupar campos de configuracion en el editor de estilos.
 */
export function CardGroup({ title, Icon, children }: CardGroupProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
        <Icon className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-3">{children}</div>
    </div>
  )
}
