'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Plus, Pencil, Search, Trash2, Package, ToggleLeft, ToggleRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Alert } from '@/components/atoms/Alert/Alert'
import { useProducts } from '@/src/hooks/pages/useProducts'
import type { Product } from '@/src/services/product.service'
import { authService } from '@/src/services/auth.service'

const TYPE_LABELS: Record<string, string> = {
  PRODUCT: 'Producto',
  SERVICE: 'Servicio',
  KIT: 'Kit',
  LOAN: 'Prestamo',
}

/**
 * Página de visualización y administración del catálogo de productos del dashboard.
 * Consume la lógica encapsulada en el hook useProducts y renderiza una interfaz interactiva premium.
 */
export default function ProductsPage() {
  const router = useRouter()
  const {
    products,
    search,
    setSearch,
    loading,
    error,
    successMsg,
    handleDelete,
    toggleActive,
    filtered,
    resolveCategoryName,
  } = useProducts()

  useEffect(() => {
    const session = authService.getSession()
    if (session?.role === 'COMPANY') {
      router.replace('/dashboard/enterprise/shop')
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(n)

  const getMainPrice = (p: Product) => (p.priceLists.length > 0 ? fmt(p.priceLists[0].amount) : '—')

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-body mb-1">Productos</h1>
          <p className="text-sm text-gray-500">
            Gestiona el catalogo de productos ({products.length} registrados)
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/products/categories">
            <Button variant="ghost">Gestionar Categorías</Button>
          </Link>
          <Link href="/dashboard/products/new">
            <Button>
              <Plus className="w-4 h-4" strokeWidth={1.5} /> Nuevo producto
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}
      {successMsg && (
        <div className="mb-4">
          <Alert type="success" message={successMsg} />
        </div>
      )}

      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          strokeWidth={1.5}
        />
        <Input
          placeholder="Buscar por nombre o SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Package className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-body-muted">
              {products.length === 0 ? 'Sin productos' : 'Sin resultados'}
            </p>
            {products.length === 0 && (
              <p className="text-xs text-body-muted mt-1">Crea tu primer producto para comenzar.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    SKU
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Nombre
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Categoria
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Tipo
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Precio
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
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 rounded-md px-2 py-1 text-gray-600">
                        {p.sku}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-sm font-medium text-body">{p.name}</span>
                        {p.windows.length > 0 && (
                          <span className="ml-2 text-[10px] bg-purple-50 text-purple-600 rounded-full px-1.5 py-0.5 font-medium">
                            {p.windows.length} acciones
                          </span>
                        )}
                        {p.usesThirdPartyPricing && (
                          <span className="ml-1 text-[10px] bg-blue-50 text-blue-600 rounded-full px-1.5 py-0.5 font-medium">
                            3rd party
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {resolveCategoryName(p.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium bg-gray-100 text-gray-500 rounded-md px-2 py-0.5 uppercase">
                        {TYPE_LABELS[p.type] ?? p.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{getMainPrice(p)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5 ${p.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-green-500' : 'bg-gray-400'}`}
                        />
                        {p.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => void toggleActive(p)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors"
                          title={p.active ? 'Desactivar' : 'Activar'}
                        >
                          {p.active ? (
                            <ToggleRight className="w-4 h-4" strokeWidth={1.5} />
                          ) : (
                            <ToggleLeft className="w-4 h-4" strokeWidth={1.5} />
                          )}
                        </button>
                        <Link
                          href={`/dashboard/products/new?id=${p.id}`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={1.5} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDelete(p.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
