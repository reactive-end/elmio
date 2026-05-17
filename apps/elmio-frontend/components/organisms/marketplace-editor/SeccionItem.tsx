'use client'

import { GripVertical, Eye, EyeOff, Trash2, Palette } from 'lucide-react'
import { etiquetaTipo } from '@/src/data/marketplace-mock'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface SeccionItemProps {
  seccion: SeccionMarketplace
  arrastrada: boolean
  objetivo: { id: string; posicion: 'antes' | 'despues' } | null
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: (posicion: 'antes' | 'despues') => void
  onDragLeave: () => void
  onDrop: () => void
  onVisibilidad: () => void
  onEditar: () => void
  onEliminar: () => void
}

/**
 * Item de seccion draggable para la pestaña de gestion de secciones.
 * Incluye indicador de orden, tipo, nombre, toggle de visibilidad y acciones.
 */
export function SeccionItem({
  seccion,
  arrastrada,
  objetivo,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onVisibilidad,
  onEditar,
  onEliminar,
}: SeccionItemProps) {
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        const limites = event.currentTarget.getBoundingClientRect()
        const posicion = event.clientY < limites.top + limites.height / 2 ? 'antes' : 'despues'
        onDragOver(posicion)
      }}
      onDrop={() => onDrop()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          onDragLeave()
        }
      }}
      className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 ${
        seccion.visible ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/50'
      } ${arrastrada ? 'scale-[0.985] opacity-45 shadow-none' : 'shadow-sm hover:border-gray-300 hover:shadow-md'}`}
    >
      {objetivo?.posicion === 'antes' && (
        <div className="absolute left-3 right-3 top-0 h-0.5 rounded-full bg-secondary shadow-[0_0_0_3px_rgba(15,78,206,0.12)]" />
      )}
      <button
        type="button"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`cursor-grab active:cursor-grabbing rounded-lg p-1.5 transition-all ${
          arrastrada
            ? 'bg-secondary/10 text-secondary'
            : 'text-gray-300 hover:bg-gray-100 hover:text-gray-500'
        }`}
        aria-label={`Reordenar ${seccion.nombre}`}
        title="Arrastra para reordenar"
      >
        <GripVertical className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
      </button>
      <span className="text-[10px] font-medium bg-gray-100 text-gray-500 rounded-md px-2 py-0.5 uppercase flex-shrink-0">
        {etiquetaTipo[seccion.tipo]}
      </span>
      <span
        className={`text-sm flex-1 ${seccion.visible ? 'text-body font-medium' : 'text-gray-400'}`}
      >
        {seccion.nombre}
      </span>
      <button
        type="button"
        onClick={onVisibilidad}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
          seccion.visible ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
        }`}
        title={seccion.visible ? 'Ocultar' : 'Mostrar'}
      >
        {seccion.visible ? (
          <Eye className="w-4 h-4" strokeWidth={1.5} />
        ) : (
          <EyeOff className="w-4 h-4" strokeWidth={1.5} />
        )}
      </button>
      <button
        type="button"
        onClick={onEditar}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors"
        title="Editar"
      >
        <Palette className="w-4 h-4" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={onEliminar}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Eliminar"
      >
        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
      </button>
      {objetivo?.posicion === 'despues' && (
        <div className="absolute left-3 right-3 bottom-0 h-0.5 rounded-full bg-secondary shadow-[0_0_0_3px_rgba(15,78,206,0.12)]" />
      )}
    </div>
  )
}
