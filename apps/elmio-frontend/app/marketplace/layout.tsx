'use client'

import { MarketplaceActionProvider } from '@/src/providers/MarketplaceActionProvider'

/**
 * Layout del segmento /marketplace que monta el `MarketplaceActionProvider`.
 *
 * Es necesario porque las paginas de consulta (mercantil/consulta,
 * mercantil/consulta-rcv, mundial/consulta-rcv) son rutas standalone que no
 * cuelgan del `MarketplaceRenderer` (ese solo envuelve la landing publica).
 * El provider expone el `LoginModal` global y el dispatch de acciones
 * (MERCANTIL-QUERY, MERCANTIL-RCV-QUERY, MUNDIAL-RCV-QUERY) que
 * `useConsultationAuth` y `ActionableLink` consumen.
 *
 * Si no estuviera aqui, los hooks `useMarketplaceAction` lanzan:
 *   "useMarketplaceAction debe usarse dentro de un MarketplaceActionProvider".
 *
 * Las pages de consulta que reciben `marketplaceId` y `marketplaceName` por
 * props/URL siguen funcionando porque el provider acepta esos campos como
 * opcionales y `buildEmbeddedUrl` ya tiene fallback por si el href original
 * no los inyecto.
 */
export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <MarketplaceActionProvider>{children}</MarketplaceActionProvider>
}
