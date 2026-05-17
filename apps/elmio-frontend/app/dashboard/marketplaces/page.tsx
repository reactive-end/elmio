'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, ExternalLink, Search } from 'lucide-react'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { marketplaceService } from '@/src/services/marketplace.service'

interface Marketplace {
  id: string
  nombre: string
  slug: string
  propietario: string
  activo: boolean
}

/**
 * Pagina de listado de marketplaces.
 * Muestra todos los marketplaces desde el backend con busqueda, estado y acciones.
 */
export default function MarketplacesPage() {
  const [search, setSearch] = useState('')
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await marketplaceService.list()
        setMarketplaces(data)
      } catch {
        setMarketplaces([])
      } finally {
        setCargando(false)
      }
    }

    void cargar()
  }, [])

  const filtered = marketplaces.filter(
    (m) =>
      m.nombre.toLowerCase().includes(search.toLowerCase()) ||
      m.slug.toLowerCase().includes(search.toLowerCase()) ||
      m.propietario.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-body mb-1">Marketplaces</h1>
          <p className="text-sm text-gray-500">Gestiona las paginas de empresas y aliados</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nuevo marketplace
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          strokeWidth={1.5}
        />
        <Input
          placeholder="Buscar por nombre, slug o propietario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Cargando marketplaces...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Nombre
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Slug
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Propietario
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Estado
                  </th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-body">{m.nombre}</span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 rounded-md px-2 py-1 text-gray-600">
                        {m.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{m.propietario}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5 ${
                          m.activo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${m.activo ? 'bg-green-500' : 'bg-gray-400'}`}
                        />
                        {m.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/marketplaces/${m.id}`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={1.5} />
                        </Link>
                        <Link
                          href={`/${m.slug}`}
                          target="_blank"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors"
                          title="Ver pagina publica"
                        >
                          <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!cargando && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No se encontraron marketplaces</p>
          </div>
        )}
      </div>
    </div>
  )
}
