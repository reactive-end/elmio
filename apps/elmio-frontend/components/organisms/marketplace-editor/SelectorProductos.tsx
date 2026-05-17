'use client'

import { ImageIcon } from 'lucide-react'

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

const productosDisponibles: ProductoMarketplace[] = [
  {
    id: 'prod-loan-001',
    nombre: 'Prestamo Personal',
    categoria: 'Prestamos',
    precio: '$500',
    imagenUrl:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=900&q=80',
    accionTipo: 'trigger',
    accionEtiqueta: 'Simular cuotas',
    destinoUrl: '',
  },
  {
    id: 'prod-loan-002',
    nombre: 'Prestamo Vehicular',
    categoria: 'Prestamos',
    precio: '$5,000',
    imagenUrl:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
    accionTipo: 'redirect',
    accionEtiqueta: 'Ir al flujo vehicular',
    destinoUrl: '/productos/prestamo-vehicular',
  },
  {
    id: 'prod-ins-001',
    nombre: 'Seguro de Vida',
    categoria: 'Seguros',
    precio: '$50',
    imagenUrl:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80',
    accionTipo: 'trigger',
    accionEtiqueta: 'Cotizar cobertura',
    destinoUrl: '',
  },
  {
    id: 'prod-ins-002',
    nombre: 'Seguro Vehicular',
    categoria: 'Seguros',
    precio: '$80',
    imagenUrl:
      'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=900&q=80',
    accionTipo: 'redirect',
    accionEtiqueta: 'Abrir landing',
    destinoUrl: '/productos/seguro-vehicular',
  },
]

interface SelectorProductosProps {
  seleccionados: string[]
  onToggle: (productoId: string) => void
}

/**
 * Selector visual de productos para el carrusel de seccion de productos.
 * Muestra una grilla de productos disponibles con toggle de seleccion.
 */
export function SelectorProductos({ seleccionados, onToggle }: SelectorProductosProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {productosDisponibles.map((producto) => {
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
              <p className="text-sm font-semibold text-body">{producto.nombre}</p>
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
