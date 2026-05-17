'use client'

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

interface SectionRendererProps {
  seccion: SeccionMarketplace
  previewMode?: boolean
  onClick?: () => void
  seleccionada?: boolean
}

/**
 * Enrutador de secciones: selecciona el renderizador adecuado segun el tipo.
 * Soporta modo preview del editor con seleccion visual.
 */
export function SectionRenderer({ seccion, previewMode, onClick, seleccionada }: SectionRendererProps) {
  if (!seccion.visible) return null

  const contenido = (
    <>
      {seccion.tipo === 'principal' && <HeroSection seccion={seccion} />}
      {seccion.tipo === 'productos' && <ProductsSection seccion={seccion} />}
      {seccion.tipo === 'banner' && <BannerSection seccion={seccion} />}
      {seccion.tipo === 'doble-banner' && <DualBannerSection seccion={seccion} />}
      {seccion.tipo === 'aliados' && <PartnersSection seccion={seccion} />}
      {seccion.tipo === 'pilares' && <PillarsSection seccion={seccion} />}
      {seccion.tipo === 'franja' && <StripSection seccion={seccion} />}
      {seccion.tipo === 'pie' && <FooterSection seccion={seccion} />}
      {seccion.tipo === 'cabecera' && <HeaderSection seccion={seccion} />}
      {seccion.tipo === 'texto' && <InfoTextSection seccion={seccion} />}
      {seccion.tipo === 'personalizado' && <InfoTextSection seccion={seccion} />}
      {seccion.tipo === 'caracteristicas' && <PillarsSection seccion={seccion} />}
    </>
  )

  if (previewMode && onClick) {
    return (
      <div onClick={onClick} className={`relative cursor-pointer transition-all ${seleccionada ? 'z-10 scale-[1.01] rounded-lg ring-2 ring-secondary ring-offset-2' : 'hover:ring-1 hover:ring-secondary/30'}`}
        style={{ marginTop: seccion.estilo.margenSuperior, marginBottom: seccion.estilo.margenInferior }}>
        {contenido}
      </div>
    )
  }

  return contenido
}
