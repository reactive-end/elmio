'use client'

import { Plus, GripVertical, EyeOff } from 'lucide-react'
import { etiquetaTipo } from '@/src/data/marketplace-mock'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface SectionListPanelProps {
  secciones: SeccionMarketplace[]
  seleccionadaId: string | null
  onSelect: (id: string) => void
  onAgregar: () => void
}

/**
 * Panel lateral con la lista de secciones para navegacion rapida en el editor.
 */
export function SectionListPanel({
  secciones,
  seleccionadaId,
  onSelect,
  onAgregar,
}: SectionListPanelProps) {
  return (
    <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Secciones</h3>
        <button
          type="button"
          onClick={onAgregar}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary text-white hover:bg-secondary-dark transition-colors"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {secciones.map((seccion) => (
          <button
            key={seccion.id}
            type="button"
            onClick={() => onSelect(seccion.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${
              seleccionadaId === seccion.id
                ? 'bg-secondary/10 text-secondary font-medium'
                : 'text-body hover:bg-gray-50'
            }`}
          >
            <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
            <span className="text-sm flex-1 truncate">{seccion.nombre}</span>
            <span className="text-[10px] font-medium text-gray-400 uppercase flex-shrink-0">
              {etiquetaTipo[seccion.tipo]}
            </span>
            {!seccion.visible && (
              <EyeOff className="w-3 h-3 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
