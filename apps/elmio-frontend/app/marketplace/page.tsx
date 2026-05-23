import type { Metadata } from 'next'
import { MarketplaceRenderer } from '@/components/renderers/MarketplaceRenderer'

export const metadata: Metadata = {
  title: 'ElMio — Marketplace Principal',
  description: 'Marketplace principal de beneficios y productos ElMio',
}

/**
 * Página pública del marketplace principal (de la empresa, sin aliado propietario).
 * Renderiza la configuración del marketplace utilizando el slug de la empresa ("elmio").
 */
export default function PrincipalMarketplacePage() {
  return <MarketplaceRenderer marketplaceSlug="elmio" />
}
