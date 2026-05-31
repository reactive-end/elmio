'use client'

import { useEffect } from 'react'
import { Eye } from 'lucide-react'
import { SectionRenderer } from '@/components/renderers/SectionRenderer'
import { MarketplaceActionProvider } from '@/src/providers/MarketplaceActionProvider'
import { WhatsAppFloatingButton } from '@/components/molecules/WhatsAppFloatingButton/WhatsAppFloatingButton'
import type { SeccionMarketplace, ConfiguracionWhatsApp } from '@/src/utils/editor-types.d'

interface VistaPreviaTabProps {
  secciones: SeccionMarketplace[]
  seleccionadaId: string | null
  onSeccionClick: (id: string) => void
  carritoActivo?: boolean
  fuente?: string
  whatsapp?: ConfiguracionWhatsApp
}

const GOOGLE_FONTS_MAP: Record<string, string> = {
  WixMadeforText: 'Wix Madefor Text',
  Inter: 'Inter',
  Geist: 'Geist',
  Roboto: 'Roboto',
  'Open Sans': 'Open Sans',
  Lato: 'Lato',
  Poppins: 'Poppins',
  Montserrat: 'Montserrat',
  Nunito: 'Nunito',
  Raleway: 'Raleway',
  Ubuntu: 'Ubuntu',
  Merriweather: 'Merriweather',
  'Playfair Display': 'Playfair Display',
  Lora: 'Lora',
  'PT Serif': 'PT Serif',
  'Source Code Pro': 'Source Code Pro',
  'JetBrains Mono': 'JetBrains Mono',
  'Fira Code': 'Fira Code',
  'DM Sans': 'DM Sans',
  'Work Sans': 'Work Sans',
  Quicksand: 'Quicksand',
}

/**
 * Pestaña de vista previa del marketplace.
 * Renderiza las secciones visibles usando los mismos componentes de renderizado publico.
 */
export function VistaPreviaTab({
  secciones,
  seleccionadaId,
  onSeccionClick,
  carritoActivo = true,
  fuente = 'Inter',
  whatsapp,
}: VistaPreviaTabProps) {
  const googleFontName = GOOGLE_FONTS_MAP[fuente] || fuente

  const fontsToLoad = new Set<string>()
  fontsToLoad.add(googleFontName)

  secciones.forEach((s) => {
    if (s.estilo?.fontFamily) {
      fontsToLoad.add(GOOGLE_FONTS_MAP[s.estilo.fontFamily] || s.estilo.fontFamily)
    }
    if (s.estilo?.promoBarFontFamily) {
      fontsToLoad.add(GOOGLE_FONTS_MAP[s.estilo.promoBarFontFamily] || s.estilo.promoBarFontFamily)
    }
  })

  const fontUrls = Array.from(fontsToLoad)
    .filter((f) => f && f !== 'Geist')
    .map(
      (f) => `https://fonts.googleapis.com/css2?family=${f.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900&display=swap`
    )

  useEffect(() => {
    fontUrls.forEach((url) => {
      if (!document.querySelector(`link[href="${url}"]`)) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = url
        document.head.appendChild(link)
      }
    })
  }, [fontUrls])

  return (
    <MarketplaceActionProvider>
      <div
        className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
        style={{ fontFamily: `'${googleFontName}', sans-serif` }}
      >
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
                carritoActivo={carritoActivo}
              />
            ))}
        </div>
      </div>
      <WhatsAppFloatingButton config={whatsapp} />
    </MarketplaceActionProvider>
  )
}

