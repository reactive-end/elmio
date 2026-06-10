/**
 * @fileoverview Hook para resaltar y hacer scroll a un producto específico.
 * @description
 * Detecta el `productId` a destacar desde los query params (`product` o
 * `highlight`) y, cuando el catálogo de productos ya está disponible,
 * hace `scrollIntoView` y aplica un ring visual al contenedor.
 *
 * Usado por el shop del marketplace cuando el usuario es redirigido
 * desde una consulta de seguro (caso EMPLOYEE).
 *
 * @module hooks/pages/useProductHighlight
 */

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/** Duración total del highlight visual (en ms) antes de desvanecerse. */
const HIGHLIGHT_DURATION_MS = 2500
/** Retraso inicial antes de hacer scroll (ms) para asegurar que el DOM está listo. */
const SCROLL_DELAY_MS = 300
/** Prefijo usado en el atributo `id` de cada card de producto. */
export const PRODUCT_CARD_ID_PREFIX = 'product-card'

interface UseProductHighlightReturn {
  /** ID del producto a destacar, o null si no hay query param. */
  highlightedProductId: string | null
  /** Devuelve el id del DOM (`product-card-<productId>`) para asignarlo a la card. */
  cardDomId: (productId: string) => string
  /** Indica si el highlight sigue activo (anillo visible). */
  isActive: boolean
}

/**
 * Hook que detecta un `productId` en los query params y hace scroll + ring
 * visual al producto correspondiente del catálogo una vez que los productos
 * ya están cargados.
 *
 * @param isReady Indica si el catálogo de productos ya está disponible.
 * @returns API del highlight.
 */
export function useProductHighlight(isReady: boolean): UseProductHighlightReturn {
  const searchParams = useSearchParams()
  const queryProduct = searchParams.get('product')
  const queryHighlight = searchParams.get('highlight')
  const highlightedProductId = queryHighlight || queryProduct
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!highlightedProductId || !isReady) return
    const element = document.getElementById(`${PRODUCT_CARD_ID_PREFIX}-${highlightedProductId}`)
    if (!element) return

    setIsActive(true)
    const scrollTimer = setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, SCROLL_DELAY_MS)
    const hideTimer = setTimeout(() => {
      setIsActive(false)
    }, SCROLL_DELAY_MS + HIGHLIGHT_DURATION_MS)

    return () => {
      clearTimeout(scrollTimer)
      clearTimeout(hideTimer)
    }
  }, [highlightedProductId, isReady])

  return {
    highlightedProductId,
    cardDomId: (productId: string) => `${PRODUCT_CARD_ID_PREFIX}-${productId}`,
    isActive,
  }
}
