import type { Metadata } from 'next'
import { MarketplaceRenderer } from '@/components/renderers/MarketplaceRenderer'

interface AllyMarketplacePageProps {
  params: Promise<{ allySlug: string }>
}

export async function generateMetadata({ params }: AllyMarketplacePageProps): Promise<Metadata> {
  const { allySlug } = await params
  return {
    title: `${allySlug} — Marketplace de Aliado ElMio`,
    description: `Página pública del marketplace del aliado ${allySlug} en ElMio`,
  }
}

/**
 * Ruta espejo pública para marketplaces de aliados.
 * Renderiza dinámicamente la configuración del aliado a partir de su slug.
 */
export default async function AllyMarketplacePage({ params }: AllyMarketplacePageProps) {
  const { allySlug } = await params

  return <MarketplaceRenderer marketplaceSlug={allySlug} />
}
