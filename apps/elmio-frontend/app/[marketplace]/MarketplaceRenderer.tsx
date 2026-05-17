'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { MarketplaceTemplate } from '@/components/renderers/MarketplaceTemplate'
import type { DatosMarketplace } from '@/src/utils/editor-types.d'
import { MERCADO_PRUEBA } from '@/app/dashboard/marketplaces/[id]/mock-data'

interface MarketplaceRendererProps {
  marketplaceSlug: string
}

/**
 * Cliente que resuelve la config del marketplace y renderiza el template publico.
 * Mientras no este conectado al backend, usa datos de prueba locales.
 */
export function MarketplaceRenderer({ marketplaceSlug }: MarketplaceRendererProps) {
  const [datos, setDatos] = useState<DatosMarketplace | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // TODO: conectar a endpoint real de marketplace-config por slug
        setDatos({ ...MERCADO_PRUEBA, slug: marketplaceSlug, nombre: marketplaceSlug })
      } catch {
        setError(true)
      }
    }

    void cargarDatos()
  }, [marketplaceSlug])

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md px-6 text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">Pagina no encontrada</h1>
          <p className="mb-6 text-gray-500">
            No se encontro una landing activa para <strong>{marketplaceSlug}</strong>.
          </p>
          <Link href="/" className="inline-block rounded-xl bg-secondary px-6 py-2 text-white transition-colors hover:bg-secondary-dark">
            Ir al inicio
          </Link>
        </div>
      </main>
    )
  }

  if (!datos) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-secondary" />
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </main>
    )
  }

  return (
    <main>
      <MarketplaceTemplate datos={datos} />
    </main>
  )
}
