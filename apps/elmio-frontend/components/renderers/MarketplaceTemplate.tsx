'use client'

import { HeaderSection } from '@/components/renderers/HeaderSection'
import { FooterSection } from '@/components/renderers/FooterSection'
import { SectionRenderer } from '@/components/renderers/SectionRenderer'
import type { DatosMarketplace } from '@/src/utils/editor-types.d'

interface MarketplaceTemplateProps {
  datos: DatosMarketplace
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
 * Template publico que renderiza un marketplace completo a partir de su config.
 * Ordena secciones, las renderiza por tipo con cabecera y pie.
 */
export function MarketplaceTemplate({ datos }: MarketplaceTemplateProps) {
  const cabecera = datos.secciones.find((s) => s.tipo === 'cabecera' && s.visible)
  const pie = datos.secciones.find((s) => s.tipo === 'pie' && s.visible)

  const fontName = datos.tema?.fuente || 'Inter'
  const googleFontName = GOOGLE_FONTS_MAP[fontName] || fontName
  const fontUrl = googleFontName !== 'Geist'
    ? `https://fonts.googleapis.com/css2?family=${googleFontName.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900&display=swap`
    : null

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: `'${googleFontName}', sans-serif` }}
    >
      {fontUrl && (
        <link rel="stylesheet" href={fontUrl} />
      )}

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

