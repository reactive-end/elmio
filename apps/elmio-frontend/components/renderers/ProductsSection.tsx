'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ActionableLink } from '@/components/atoms/ActionableLink/ActionableLink'
import { SectionContainer } from './SectionContainer'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface ProductsSectionProps {
  seccion: SeccionMarketplace
}

/**
 * Renderiza la seccion de productos con carrusel horizontal navegable.
 * Carga dinámicamente los productos activos del backend (auto-poblado o filtrado por ID).
 */
export function ProductsSection({ seccion }: ProductsSectionProps) {
  const { contenido, estilo } = seccion
  
  const [listaProductos, setListaProductos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelado = false

    const cargarProductos = async () => {
      try {
        setCargando(true)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/products`)
        if (!res.ok) throw new Error(`Error al listar productos: ${res.status}`)
        const allProducts = (await res.json()) as { id: string; name: string; description: string; images: string[]; active: boolean; type: string; priceLists: { currency: string; amount: number }[] }[]
        
        if (cancelado) return

        // Cargar todos los productos (activos e inactivos)
        const allLoadedProducts = allProducts
        
        let filtered: any[] = []
        const hasSpecificIds = contenido.productosIds && contenido.productosIds.length > 0
        
        if (hasSpecificIds) {
          // Filtrar por IDs específicos indicados en el editor
          filtered = allLoadedProducts.filter((p) => contenido.productosIds.includes(p.id))
        } else {
          // Mostrar todos si es auto-poblar o si no hay elementos manuales
          filtered = allLoadedProducts
        }

        const MERCANTIL_PROVIDER_SLUGS: Record<string, string> = {
          'elmio:mercantil-vida': 'life',
          'elmio:mercantil-accidentes': 'personalAccidents',
          'elmio:mercantil-funeraria': 'funerary',
        }

        // Mapear los productos reales al formato compatible de ElementoSeccion
        const mapped = filtered.map((p) => {
          const priceStr = p.priceLists?.[0]
            ? `${p.priceLists[0].currency} ${Number(p.priceLists[0].amount).toLocaleString()}`
            : ''
            
          const hasMercantilQuery = p.windows?.some(
            (w: any) => w.type === 'custom-form' && w.config?.redirectUrl === 'mercantil-query-form'
          )
          const hasMercantilRcvQuery = p.windows?.some(
            (w: any) => w.type === 'custom-form' && w.config?.redirectUrl === 'mercantil-rcv-query-form'
          )

          let enlaceBoton = p.active ? `/dashboard/enterprise/shop?product=${p.id}` : null
          if (p.active) {
            if (hasMercantilRcvQuery) {
              enlaceBoton = `action:mercantil-rcv-query?productId=${p.id}`
            } else if (hasMercantilQuery) {
              const provider = p.globalThirdPartyProvider ?? ''
              const slug = MERCANTIL_PROVIDER_SLUGS[provider] || ''
              enlaceBoton = `action:mercantil-query?productId=${p.id}&slug=${slug}`
            }
          }

          return {
            id: p.id,
            titulo: p.name,
            descripcion: p.description || '',
            imagenUrl: p.images?.[0] || '',
            enlaceUrl: priceStr, // Usamos la etiqueta para mostrar el precio formateado
            textoBoton: !p.active ? 'No disponible' : p.type === 'LOAN' ? 'Solicitar' : 'Comprar',
            enlaceBoton,
            active: p.active,
          }
        })
        
        setListaProductos(mapped)
      } catch (err) {
        console.error('Error al cargar productos en ProductsSection:', err)
        // Fallback a los elementos estáticos en caso de error
        if (!cancelado) {
          setListaProductos(contenido.elementos ?? [])
        }
      } finally {
        if (!cancelado) {
          setCargando(false)
        }
      }
    }
    
    // Si tenemos elementos manuales configurados y no es auto-poblar ni específico, usarlos
    const hasStaticElements = contenido.elementos && contenido.elementos.length > 0
    const isAutoPopulate = contenido.autoPoblarProductos === true
    const hasSpecificIds = contenido.productosIds && contenido.productosIds.length > 0
    
    if (hasStaticElements && !isAutoPopulate && !hasSpecificIds) {
      setListaProductos(contenido.elementos)
      setCargando(false)
    } else {
      void cargarProductos()
    }

    return () => {
      cancelado = true
    }
  }, [contenido.productosIds, contenido.autoPoblarProductos, contenido.elementos])

  const productos = listaProductos
  const autoplay = contenido.autoplay !== false
  const velocidad = contenido.autoplayVelocidad || 5000

  const trackRef = useRef<HTMLDivElement>(null)
  const [indiceActual, setIndiceActual] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tarjetasPorVista = 5
  const anchoTarjeta = 208
  const espacio = 16
  const paso = anchoTarjeta + espacio

  const maxIndice = Math.max(0, productos.length - tarjetasPorVista)
  const puedeAvanzar = productos.length > tarjetasPorVista

  const desplazarA = useCallback(
    (idx: number) => {
      const limite = Math.max(0, Math.min(idx, maxIndice))
      setIndiceActual(limite)
      if (trackRef.current) trackRef.current.style.transform = `translateX(${-(limite * paso)}px)`
    },
    [maxIndice, paso],
  )

  useEffect(() => {
    if (!autoplay || !puedeAvanzar || cargando) return
    intervalRef.current = setInterval(() => {
      setIndiceActual((prev) => {
        const next = prev >= maxIndice ? 0 : prev + 1
        if (trackRef.current) trackRef.current.style.transform = `translateX(${-(next * paso)}px)`
        return next
      })
    }, velocidad)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoplay, puedeAvanzar, maxIndice, velocidad, paso, cargando])

  if (cargando) {
    return (
      <SectionContainer estilo={estilo} id={contenido.htmlId || undefined}>
        <div className="mx-auto px-4 text-center py-12">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
          <p className="text-xs text-gray-400 mt-2">Cargando productos...</p>
        </div>
      </SectionContainer>
    )
  }

  if (productos.length === 0) return null

  return (
    <SectionContainer estilo={estilo} id={contenido.htmlId || undefined}>
      <div className="mx-auto px-4">
        {contenido.titulo && (
          <h2
            className="mb-8 text-3xl font-bold"
            style={{ color: estilo.tituloColor, textAlign: estilo.tituloAlineacion as never }}
          >
            {contenido.titulo}
          </h2>
        )}

        <div className="relative mx-auto" style={{ maxWidth: tarjetasPorVista * paso }}>
          {puedeAvanzar && (
            <>
              <button
                type="button"
                onClick={() => desplazarA(indiceActual - 1)}
                disabled={indiceActual === 0}
                className="absolute -left-6 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gray-200 bg-white shadow-lg transition-all hover:scale-110 disabled:opacity-50 md:flex cursor-pointer"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => desplazarA(indiceActual + 1)}
                disabled={indiceActual >= maxIndice}
                className="absolute -right-6 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gray-200 bg-white shadow-lg transition-all hover:scale-110 disabled:opacity-50 md:flex cursor-pointer"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          )}

          <div className="overflow-hidden">
            <div
              ref={trackRef}
              className="flex gap-4 pb-2"
              style={{
                width: productos.length * paso,
                transition: 'transform 300ms ease-out',
              }}
            >
              {productos.map((producto) => (
                <div
                  key={producto.id}
                  className={`shrink-0 overflow-hidden shadow-sm transition-shadow hover:shadow-md bg-white transition-all ${
                    producto.active === false ? 'opacity-65 bg-gray-50/30' : ''
                  }`}
                  style={{
                    width: anchoTarjeta,
                    backgroundColor: estilo.tarjetaColorFondo || '#ffffff',
                    borderRadius: estilo.tarjetaRadioBorde !== undefined ? estilo.tarjetaRadioBorde : 16,
                    borderWidth: estilo.tarjetaAnchoBorde !== undefined ? estilo.tarjetaAnchoBorde : 1,
                    borderColor: estilo.tarjetaColorBorde || '#f3f4f6',
                    borderStyle: (estilo.tarjetaAnchoBorde ?? 1) > 0 ? 'solid' : 'none',
                  }}
                >
                  <div
                    className="relative h-32 bg-gray-50"
                    style={{ height: estilo.altoImagenProducto || 200 }}
                  >
                    {producto.imagenUrl ? (
                      <img
                        src={producto.imagenUrl}
                        alt={producto.titulo}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-gray-400 font-semibold bg-gray-50 uppercase tracking-wider">
                        Sin imagen
                      </div>
                    )}
                    {producto.active === false && (
                      <span className="absolute top-3 left-3 rounded-full bg-gray-900/85 px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow-sm backdrop-blur-sm">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    {producto.enlaceUrl && (
                      <span
                        className="mb-2 inline-block bg-secondary/10 px-2.5 py-1 text-[10px] font-bold text-secondary"
                        style={{ borderRadius: estilo.botonRedondez !== undefined ? estilo.botonRedondez : 8 }}
                      >
                        {producto.enlaceUrl}
                      </span>
                    )}
                    <h4 className="text-sm font-semibold text-body line-clamp-2">
                      {producto.titulo}
                    </h4>
                    {producto.descripcion && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {producto.descripcion}
                      </p>
                    )}
                    <div className="mt-auto pt-3">
                      {producto.enlaceBoton ? (
                        <ActionableLink
                          href={producto.enlaceBoton}
                          className="block w-full py-2 text-center text-sm font-medium transition-colors cursor-pointer"
                          style={{
                            backgroundColor: estilo.botonColorFondo || '#0f4ece',
                            color: estilo.botonColorTexto || '#fff',
                            borderRadius: estilo.botonRedondez !== undefined ? estilo.botonRedondez : 12,
                            borderWidth: estilo.botonAnchoBorde !== undefined ? estilo.botonAnchoBorde : 0,
                            borderColor: estilo.botonColorBorde || estilo.botonColorFondo || '#0f4ece',
                            borderStyle: (estilo.botonAnchoBorde ?? 0) > 0 ? 'solid' : 'none',
                          }}
                        >
                          {producto.textoBoton || 'Ver detalle'}
                        </ActionableLink>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="block w-full py-2 text-center text-sm font-medium transition-colors opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-none"
                          style={{
                            borderRadius: estilo.botonRedondez !== undefined ? estilo.botonRedondez : 12,
                          }}
                        >
                          {producto.textoBoton || 'No disponible'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {contenido.textoBoton && contenido.enlaceBoton && (
          <div className="mt-10 text-center">
            <ActionableLink
              href={contenido.enlaceBoton}
              className="inline-flex items-center px-6 py-3 font-semibold shadow transition-transform hover:scale-105 cursor-pointer"
              style={{
                backgroundColor: estilo.botonColorFondo || '#0f4ece',
                color: estilo.botonColorTexto || '#fff',
                borderRadius: estilo.botonRedondez !== undefined ? estilo.botonRedondez : 12,
                borderWidth: estilo.botonAnchoBorde !== undefined ? estilo.botonAnchoBorde : 0,
                borderColor: estilo.botonColorBorde || estilo.botonColorFondo || '#0f4ece',
                borderStyle: (estilo.botonAnchoBorde ?? 0) > 0 ? 'solid' : 'none',
              }}
            >
              {contenido.textoBoton}
            </ActionableLink>
          </div>
        )}
      </div>
    </SectionContainer>
  )
}
