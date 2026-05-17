'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { MarketplaceTemplate } from '@/components/renderers/MarketplaceTemplate'
import { marketplaceService } from '@/src/services/marketplace.service'
import type { DatosMarketplace } from '@/src/utils/editor-types.d'

interface MarketplaceRendererProps {
  marketplaceSlug: string
}

/**
 * Cliente que resuelve la config del marketplace desde el backend y renderiza el template publico.
 * Llama a GET /api/marketplaces/slug/:slug para obtener la configuracion.
 */
export function MarketplaceRenderer({ marketplaceSlug }: MarketplaceRendererProps) {
  const [datos, setDatos] = useState<DatosMarketplace | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelado = false

    const cargarDatos = async () => {
      setCargando(true)
      setError(false)

      try {
        const config = await marketplaceService.getBySlug(marketplaceSlug)
        if (!cancelado) {
          setDatos(config)
        }
      } catch {
        if (!cancelado) {
          setError(true)
        }
      } finally {
        if (!cancelado) {
          setCargando(false)
        }
      }
    }

    void cargarDatos()

    return () => {
      cancelado = true
    }
  }, [marketplaceSlug])

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-secondary" />
          <p className="text-sm text-gray-500">Cargando marketplace...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md px-6 text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">Pagina no encontrada</h1>
          <p className="mb-6 text-gray-500">
            No se encontro una landing activa para <strong>{marketplaceSlug}</strong>.
          </p>
          <Link
            href="/"
            className="inline-block rounded-xl bg-secondary px-6 py-2 text-white transition-colors hover:bg-secondary-dark"
          >
            Ir al inicio
          </Link>
        </div>
      </main>
    )
  }

  if (!datos) return null

  return (
    <main>
      <MarketplaceTemplate datos={datos} />
    </main>
  )
}
