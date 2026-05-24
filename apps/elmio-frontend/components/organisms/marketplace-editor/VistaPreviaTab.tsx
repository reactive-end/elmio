'use client'

import { Eye } from 'lucide-react'
import { SectionRenderer } from '@/components/renderers/SectionRenderer'
import { MarketplaceActionProvider } from '@/src/providers/MarketplaceActionProvider'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface VistaPreviaTabProps {
  secciones: SeccionMarketplace[]
  seleccionadaId: string | null
  onSeccionClick: (id: string) => void
}

/**
 * Pestaña de vista previa del marketplace.
 * Renderiza las secciones visibles usando los mismos componentes de renderizado publico.
 */
export function VistaPreviaTab({ secciones, seleccionadaId, onSeccionClick }: VistaPreviaTabProps) {
  return (
    <MarketplaceActionProvider>
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
          <Eye className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Vista previa — {secciones.filter((s) => s.visible).length} secciones visibles
          </span>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-100">
          {secciones
            .filter((s) => s.visible)
            .sort((a, b) => a.orden - b.orden)
            .map((seccion) => (
              <SectionRenderer
                key={seccion.id}
                seccion={seccion}
                previewMode
                seleccionada={seleccionadaId === seccion.id}
                onClick={() => onSeccionClick(seccion.id)}
              />
            ))}
        </div>
      </div>
    </MarketplaceActionProvider>
  )
}
