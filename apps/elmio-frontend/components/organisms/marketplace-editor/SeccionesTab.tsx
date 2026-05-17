'use client'

import { LayoutGrid, Plus } from 'lucide-react'
import { SeccionItem } from './SeccionItem'
import type { SeccionMarketplace, TipoSeccion } from '@/src/utils/editor-types.d'

interface SeccionesTabProps {
  secciones: SeccionMarketplace[]
  seccionArrastradaId: string | null
  objetivoArrastre: { id: string; posicion: 'antes' | 'despues' } | null
  onAgregarClick: () => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDragOver: (seccionId: string, posicion: 'antes' | 'despues') => void
  onDragLeave: (seccionId: string) => void
  onDrop: () => void
  onVisibilidad: (id: string) => void
  onEditar: (id: string) => void
  onEliminar: (id: string) => void
  tipoSeleccionado?: TipoSeccion
}

/**
 * Pestaña de gestion de secciones con drag and drop.
 * Muestra todas las secciones ordenadas con controles de visibilidad, edicion y eliminacion.
 */
export function SeccionesTab({
  secciones,
  seccionArrastradaId,
  objetivoArrastre,
  onAgregarClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onVisibilidad,
  onEditar,
  onEliminar,
}: SeccionesTabProps) {
  const ordenadas = [...secciones].sort((a, b) => a.orden - b.orden)

  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Gestion de secciones — {secciones.length} total
          </span>
        </div>
        <button
          type="button"
          onClick={onAgregarClick}
          className="flex items-center gap-1.5 text-xs font-medium bg-secondary text-white hover:bg-secondary-dark rounded-lg px-3 py-1.5 transition-colors"
        >
          <Plus className="w-3 h-3" strokeWidth={2} /> Agregar seccion
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-2">
          {ordenadas.map((seccion) => (
            <SeccionItem
              key={seccion.id}
              seccion={seccion}
              arrastrada={seccionArrastradaId === seccion.id}
              objetivo={objetivoArrastre?.id === seccion.id ? objetivoArrastre : null}
              onDragStart={() => onDragStart(seccion.id)}
              onDragEnd={onDragEnd}
              onDragOver={(posicion) => onDragOver(seccion.id, posicion)}
              onDragLeave={() => onDragLeave(seccion.id)}
              onDrop={onDrop}
              onVisibilidad={() => onVisibilidad(seccion.id)}
              onEditar={() => onEditar(seccion.id)}
              onEliminar={() => onEliminar(seccion.id)}
            />
          ))}
        </div>
        {secciones.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm mb-2">No hay secciones aun</p>
            <button
              type="button"
              onClick={onAgregarClick}
              className="text-secondary hover:text-secondary-dark text-sm font-medium"
            >
              Agregar la primera seccion
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
