'use client'

import { HeaderSection } from '@/components/renderers/HeaderSection'
import { FooterSection } from '@/components/renderers/FooterSection'
import { SectionRenderer } from '@/components/renderers/SectionRenderer'
import type { DatosMarketplace } from '@/src/utils/editor-types.d'

interface MarketplaceTemplateProps {
  datos: DatosMarketplace
}

/**
 * Template publico que renderiza un marketplace completo a partir de su config.
 * Ordena secciones, las renderiza por tipo con cabecera y pie.
 */
export function MarketplaceTemplate({ datos }: MarketplaceTemplateProps) {
  const cabecera = datos.secciones.find((s) => s.tipo === 'cabecera' && s.visible)
  const pie = datos.secciones.find((s) => s.tipo === 'pie' && s.visible)

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: `'${datos.tema?.fuente || 'Inter'}', sans-serif` }}
    >
      {cabecera && <HeaderSection seccion={cabecera} carritoActivo={datos.carrito?.activo ?? true} />}

      {datos.secciones
        .filter((s) => s.tipo !== 'cabecera' && s.tipo !== 'pie')
        .sort((a, b) => a.orden - b.orden)
        .map((seccion) => (
          <SectionRenderer key={seccion.id} seccion={seccion} carritoActivo={datos.carrito?.activo ?? true} />
        ))}

      {pie && <FooterSection seccion={pie} />}
    </div>
  )
}
