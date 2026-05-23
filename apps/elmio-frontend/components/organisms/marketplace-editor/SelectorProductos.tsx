'use client'

import { useEffect, useState } from 'react'
import { ImageIcon, Loader2 } from 'lucide-react'
import { productService } from '@/src/services/product.service'

interface ProductoMarketplace {
  id: string
  nombre: string
  categoria: string
  precio: string
  imagenUrl: string
  accionTipo: 'redirect' | 'trigger'
  accionEtiqueta: string
  destinoUrl: string
}

interface SelectorProductosProps {
  seleccionados: string[]
  onToggle: (productoId: string) => void
}

/**
 * Selector visual de productos para el carrusel de seccion de productos.
 * Trae los productos reales del backend.
 */
export function SelectorProductos({ seleccionados, onToggle }: SelectorProductosProps) {
  const [productos, setProductos] = useState<ProductoMarketplace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true)
        setError(null)
        const data = await productService.list()
        
        // Mapear de Product (Backend) a ProductoMarketplace (Frontend)
        const mapped: ProductoMarketplace[] = data.map((p) => {
          const firstPrice = p.priceLists?.[0]
          const precioFormatted = firstPrice 
            ? `${firstPrice.currency === 'USD' ? '$' : firstPrice.currency}${firstPrice.amount}`
            : '$0'

          const firstWindow = p.windows?.[0]
          const accionTipo = firstWindow?.type === 'external-redirect' ? 'redirect' : 'trigger'
          
          return {
            id: p.id,
            nombre: p.name,
            categoria: p.category,
            precio: precioFormatted,
            imagenUrl: p.images?.[0] || '',
            accionTipo,
            accionEtiqueta: firstWindow?.label || 'Ver detalle',
            destinoUrl: firstWindow?.config?.redirectUrl || '',
          }
        })
        
        setProductos(mapped)
      } catch (err) {
        console.error('Error al cargar productos en el editor:', err)
        setError('No se pudieron cargar los productos.')
      } finally {
        setLoading(false)
      }
    }
    
    void loadProducts()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-2 text-body-muted">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        <p className="text-sm">Cargando productos...</p>
      </div>
    )
  }

  if (error || productos.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
        <p className="text-sm text-body-muted">
          {error ?? 'No hay productos registrados en el sistema.'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {productos.map((producto) => {
        const activo = seleccionados.includes(producto.id)

        return (
          <button
            key={producto.id}
            type="button"
            onClick={() => onToggle(producto.id)}
            className={`overflow-hidden rounded-2xl border text-left transition-all duration-200 ${
              activo
                ? 'border-secondary bg-secondary/5 shadow-sm ring-2 ring-secondary/10'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
            }`}
          >
            <div className="relative h-32 bg-gray-100">
              {producto.imagenUrl ? (
                <img
                  src={producto.imagenUrl}
                  alt={producto.nombre}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300">
                  <ImageIcon className="h-6 w-6" strokeWidth={1.5} />
                </div>
              )}
              <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-secondary shadow-sm">
                {activo ? 'Incluido' : 'Disponible'}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-body truncate">{producto.nombre}</p>
                <span className="text-xs font-semibold text-secondary flex-shrink-0">{producto.precio}</span>
              </div>
              <div className="mt-3 space-y-1 text-[11px] text-gray-500">
                <p>
                  {producto.accionTipo === 'redirect'
                    ? `Accion: redireccion a ${producto.destinoUrl}`
                    : `Accion: ${producto.accionEtiqueta}`}
                </p>
                <p>
                  {activo
                    ? 'Se mostrara en el carrusel renderizado.'
                    : 'Disponible para agregar al carrusel.'}
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
