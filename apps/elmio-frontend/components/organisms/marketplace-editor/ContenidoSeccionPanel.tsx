'use client'

import type { SeccionMarketplace } from '@/src/utils/editor-types.d'
import { PanelCabecera } from './panels/PanelCabecera'
import { PanelPrincipal } from './panels/PanelPrincipal'
import { PanelProductos } from './panels/PanelProductos'
import { PanelBanner } from './panels/PanelBanner'
import { PanelDobleBanner } from './panels/PanelDobleBanner'
import { PanelAliados } from './panels/PanelAliados'
import { PanelPilares } from './panels/PanelPilares'
import { PanelFranja } from './panels/PanelFranja'
import { PanelTexto } from './panels/PanelTexto'
import { PanelPie } from './panels/PanelPie'
import { PanelCaracteristicas } from './panels/PanelCaracteristicas'
import { BloqueContenidoBase } from './panels/BloqueContenidoBase'

interface ContenidoSeccionPanelProps {
  seccion: SeccionMarketplace
  actualizarContenido: (campo: keyof SeccionMarketplace['contenido'], valor: string) => void
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
}

/**
 * Enrutador de paneles de contenido para el editor de marketplace.
 * Selecciona el panel adecuado segun el tipo de seccion.
 */
export function ContenidoSeccionPanel({
  seccion,
  actualizarContenido,
  actualizarSeccion,
}: ContenidoSeccionPanelProps) {
  switch (seccion.tipo) {
    case 'cabecera':
      return <PanelCabecera seccion={seccion} actualizarSeccion={actualizarSeccion} />
    case 'principal':
      return <PanelPrincipal seccion={seccion} actualizarSeccion={actualizarSeccion} />
    case 'productos':
      return <PanelProductos seccion={seccion} actualizarSeccion={actualizarSeccion} />
    case 'banner':
      return <PanelBanner seccion={seccion} actualizarSeccion={actualizarSeccion} />
    case 'doble-banner':
      return <PanelDobleBanner seccion={seccion} actualizarSeccion={actualizarSeccion} />
    case 'aliados':
      return <PanelAliados seccion={seccion} actualizarSeccion={actualizarSeccion} />
    case 'pilares':
      return <PanelPilares seccion={seccion} actualizarSeccion={actualizarSeccion} />
    case 'franja':
      return <PanelFranja seccion={seccion} actualizarSeccion={actualizarSeccion} />
    case 'texto':
      return <PanelTexto seccion={seccion} actualizarSeccion={actualizarSeccion} />
    case 'pie':
      return <PanelPie seccion={seccion} actualizarSeccion={actualizarSeccion} />
    case 'caracteristicas':
      return <PanelCaracteristicas seccion={seccion} actualizarContenido={actualizarContenido} />
    default:
      return <BloqueContenidoBase seccion={seccion} actualizarContenido={actualizarContenido} />
  }
}
