import type { Metadata } from 'next'
import { MarketplaceRenderer } from './MarketplaceRenderer'

interface MarketplacePageProps {
  params: Promise<{ marketplace: string }>
}

export async function generateMetadata({ params }: MarketplacePageProps): Promise<Metadata> {
  const { marketplace } = await params
  return {
    title: `${marketplace} — ElMio`,
    description: `Pagina publica del marketplace ${marketplace} en ElMio`,
  }
}

/**
 * Pagina publica del marketplace que renderiza la landing completa a partir de la config.
 * Resuelve los datos del marketplace y los pasa al template renderizador.
 */
export default async function MarketplacePage({ params }: MarketplacePageProps) {
  const { marketplace } = await params

  return <MarketplaceRenderer marketplaceSlug={marketplace} />
}
