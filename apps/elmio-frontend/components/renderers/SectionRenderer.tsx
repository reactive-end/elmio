'use client'

import type { ComponentType } from 'react'
import { HeroSection } from './HeroSection'
import { ProductsSection } from './ProductsSection'
import { BannerSection } from './BannerSection'
import { DualBannerSection } from './DualBannerSection'
import { PartnersSection } from './PartnersSection'
import { PillarsSection } from './PillarsSection'
import { StripSection } from './StripSection'
import { FooterSection } from './FooterSection'
import { HeaderSection } from './HeaderSection'
import { InfoTextSection } from './InfoTextSection'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

type RendererComponent = ComponentType<{ seccion: SeccionMarketplace }>

const rendererRegistry: Record<string, RendererComponent> = {
  principal: HeroSection,
  productos: ProductsSection,
  banner: BannerSection,
  'doble-banner': DualBannerSection,
  aliados: PartnersSection,
  pilares: PillarsSection,
  caracteristicas: PillarsSection,
  franja: StripSection,
  pie: FooterSection,
  cabecera: HeaderSection,
  texto: InfoTextSection,
  personalizado: InfoTextSection,
}

interface SectionRendererProps {
  seccion: SeccionMarketplace
  previewMode?: boolean
  onClick?: () => void
  seleccionada?: boolean
}

/**
 * Enrutador de secciones: selecciona el renderizador adecuado segun el tipo usando un registry.
 * Soporta modo preview del editor con seleccion visual.
 */
export function SectionRenderer({
  seccion,
  previewMode,
  onClick,
  seleccionada,
}: SectionRendererProps) {
  if (!seccion.visible) return null

  const Renderer = rendererRegistry[seccion.tipo]

  const contenido = Renderer ? <Renderer seccion={seccion} /> : null

  if (previewMode && onClick) {
    return (
      <div
        onClick={onClick}
        className={`relative cursor-pointer transition-all ${
          seleccionada
            ? 'z-10 scale-[1.01] rounded-lg ring-2 ring-secondary ring-offset-2'
            : 'hover:ring-1 hover:ring-secondary/30'
        }`}
        style={{
          marginTop: seccion.estilo.margenSuperior,
          marginBottom: seccion.estilo.margenInferior,
        }}
      >
        {contenido}
      </div>
    )
  }

  return contenido
}
