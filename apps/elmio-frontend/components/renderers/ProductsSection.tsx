'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ActionableLink } from '@/components/atoms/ActionableLink/ActionableLink'
import { SectionContainer } from './SectionContainer'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'
import { authService } from '@/src/services/auth.service'

interface ProductsSectionProps {
  seccion: SeccionMarketplace
}

/**
 * Renderiza la seccion de productos con carrusel horizontal navegable.
 * Carga dinámicamente los productos activos del backend (auto-poblado o filtrado por ID).
 */
export function ProductsSection({ seccion }: ProductsSectionProps) {
  const { contenido, estilo } = seccion
  
  const router = useRouter()
  const [listaProductos, setListaProductos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  const [selectedProductForScheme, setSelectedProductForScheme] = useState<any | null>(null)
  const [showSchemeSelectorModal, setShowSchemeSelectorModal] = useState(false)

  const handleProductClick = (producto: any, e: React.MouseEvent) => {
    const raw = producto.rawProduct
    if (!raw) return

    const hasMercantilQuery = raw.windows?.some(
      (w: any) => w.type === 'custom-form' && w.config?.redirectUrl === 'mercantil-query-form'
    )
    const hasMercantilRcvQuery = raw.windows?.some(
      (w: any) => w.type === 'custom-form' && w.config?.redirectUrl === 'mercantil-rcv-query-form'
    )
    const hasMundialRcvQuery = raw.windows?.some(
      (w: any) => w.type === 'custom-form' && w.config?.redirectUrl === 'mundial-rcv-query-form'
    )

    // Si tiene consultas mercantil o mundial (custom-form actions), no interceptamos, delegamos a ActionableLink
    if (hasMercantilQuery || hasMercantilRcvQuery || hasMundialRcvQuery) {
      return
    }

    const hasWindows = raw.windows && raw.windows.length > 0

    // Si tiene ventanas de acción de compra estándar, navega a la tienda
    if (hasWindows) {
      router.push(`/dashboard/enterprise/shop?product=${raw.id}`)
      return
    }

    // SI NO TIENE VENTANAS DE ACCIÓN: Validar sesión
    e.preventDefault()
    const session = authService.getSession()
    const defaultSchemeId = raw.financingSchemes?.[0]?.id || 'default'

    if (!session) {
      // Forzar redirección al portal de login y retornar al checkout en _blank (enlace final)
      const targetUrl = `/dashboard/enterprise/shop/checkout?product=${raw.id}&scheme=${defaultSchemeId}`
      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`)
      return
    }

    // Si está autenticado y tiene múltiples esquemas de financiamiento
    if (raw.financingSchemes && raw.financingSchemes.length > 1) {
      setSelectedProductForScheme(raw)
      setShowSchemeSelectorModal(true)
    } else {
      // Un solo esquema o predeterminado
      window.open(`/dashboard/enterprise/shop/checkout?product=${raw.id}&scheme=${defaultSchemeId}`, '_blank')
    }
  }

  const handleSelectSchemeAndProceed = (schemeId: string) => {
    if (!selectedProductForScheme) return
    window.open(`/dashboard/enterprise/shop/checkout?product=${selectedProductForScheme.id}&scheme=${schemeId}`, '_blank')
    setShowSchemeSelectorModal(false)
    setSelectedProductForScheme(null)
  }

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
          // Filtrar por IDs específicos e indexar para mantener el orden exacto de productosIds
          const map = new Map(allLoadedProducts.map((p) => [p.id, p]))
          filtered = contenido.productosIds
            .map((id) => map.get(id))
            .filter((p): p is NonNullable<typeof p> => !!p)
        } else {
          // Mostrar todos si es auto-poblar o si no hay elementos manuales
          filtered = allLoadedProducts
        }

        const MERCANTIL_PROVIDER_SLUGS: Record<string, string> = {
          'elmio:mercantil-vida': 'life',
          'elmio:mercantil-accidentes': 'personalAccidents',
          'elmio:mercantil-funeraria': 'funerary',
          'elmio:mercantil-rcv': 'rcv',
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
          const hasMundialRcvQuery = p.windows?.some(
            (w: any) => w.type === 'custom-form' && w.config?.redirectUrl === 'mundial-rcv-query-form'
          )

          let enlaceBoton = p.active ? `/dashboard/enterprise/shop?product=${p.id}` : null
          if (p.active) {
            if (hasMercantilRcvQuery) {
              enlaceBoton = `action:mercantil-rcv-query?productId=${p.id}`
            } else if (hasMundialRcvQuery) {
              enlaceBoton = `action:mundial-rcv-query?productId=${p.id}`
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
            rawProduct: p,
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [showArrows, setShowArrows] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tarjetasPorVista = 5
  const anchoTarjeta = estilo.tarjetaAncho || 208
  const espacio = 16
  const paso = anchoTarjeta + espacio

  const checkScrollState = useCallback(() => {
    if (!containerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
    
    setCanScrollLeft(scrollLeft > 1)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
    setShowArrows(scrollWidth > clientWidth)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el || cargando) return

    checkScrollState()

    el.addEventListener('scroll', checkScrollState)
    window.addEventListener('resize', checkScrollState)

    const t = setTimeout(checkScrollState, 100)

    return () => {
      el.removeEventListener('scroll', checkScrollState)
      window.removeEventListener('resize', checkScrollState)
      clearTimeout(t)
    }
  }, [productos, cargando, checkScrollState])

  const desplazar = (direccion: 'izquierda' | 'derecha') => {
    if (!containerRef.current) return
    const offset = direccion === 'izquierda' ? -paso : paso
    containerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  /**
   * Reposiciona el scroll de forma instantánea para simular un loop infinito.
   * El track se renderiza duplicado ([...productos, ...productos]), de modo que
   * al cruzar el umbral del primer set hacia el segundo (o viceversa) el
   * scrollLeft se ajusta sin que el usuario perciba el salto.
   */
  const handleInfiniteScroll = useCallback(() => {
    const el = containerRef.current
    if (!el || productos.length === 0) return
    const { scrollLeft, scrollWidth } = el
    const halfWidth = scrollWidth / 2
    if (scrollLeft >= halfWidth) {
      el.scrollLeft = scrollLeft - halfWidth
    } else if (scrollLeft < 0) {
      el.scrollLeft = scrollLeft + halfWidth
    }
  }, [productos.length])

  const autoplay = contenido.autoplay !== false
  const velocidad = contenido.autoplayVelocidad || 5000

  useEffect(() => {
    if (!autoplay || !showArrows || cargando) return
    intervalRef.current = setInterval(() => {
      if (containerRef.current) {
        containerRef.current.scrollBy({ left: paso, behavior: 'smooth' })
      }
    }, velocidad)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoplay, showArrows, velocidad, paso, cargando])

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
        <div className="relative mx-auto" style={{ maxWidth: tarjetasPorVista * paso }}>
          {contenido.titulo && (
            <h2
              className="mb-8 text-3xl font-bold"
              style={{ color: estilo.tituloColor, textAlign: estilo.tituloAlineacion as never, fontWeight: estilo.tituloPeso }}
            >
              {contenido.titulo}
            </h2>
          )}
          {showArrows && (
            <>
              <button
                type="button"
                onClick={() => desplazar('izquierda')}
                disabled={!canScrollLeft}
                className="absolute -left-6 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gray-200 bg-white shadow-lg transition-all hover:scale-110 disabled:opacity-50 cursor-pointer"
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
                onClick={() => desplazar('derecha')}
                disabled={!canScrollRight}
                className="absolute -right-6 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gray-200 bg-white shadow-lg transition-all hover:scale-110 disabled:opacity-50 cursor-pointer"
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

          <div
            ref={containerRef}
            className="overflow-x-auto no-scrollbar scroll-smooth"
            style={{ overscrollBehaviorX: 'contain' }}
            onScroll={handleInfiniteScroll}
          >
            <div
              className="flex items-stretch gap-4 pb-2"
              style={{
                width: 'max-content',
              }}
            >
              {[...productos, ...productos].map((producto, idx) => (
                <div
                  key={`${producto.id}-${idx}`}
                  className={`shrink-0 overflow-hidden shadow-sm transition-shadow hover:shadow-md bg-white transition-all flex flex-col self-stretch ${
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
                    className="relative bg-gray-50 flex-shrink-0"
                    style={{ height: estilo.altoImagenProducto || anchoTarjeta }}
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
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
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
                    </div>
                    <div className="mt-auto pt-3">
                      {producto.active ? (
                        producto.rawProduct && (!producto.rawProduct.windows || producto.rawProduct.windows.length === 0) ? (
                          <button
                            type="button"
                            onClick={(e) => handleProductClick(producto, e)}
                            className="block w-full py-2 text-center text-sm font-medium transition-colors cursor-pointer border-none"
                            style={{
                              backgroundColor: estilo.botonColorFondo || '#0f4ece',
                              color: estilo.botonColorTexto || '#fff',
                              borderRadius: estilo.botonRedondez !== undefined ? estilo.botonRedondez : 12,
                              borderWidth: estilo.botonAnchoBorde !== undefined ? estilo.botonAnchoBorde : 0,
                              borderColor: estilo.botonColorBorde || estilo.botonColorFondo || '#0f4ece',
                              borderStyle: (estilo.botonAnchoBorde ?? 0) > 0 ? 'solid' : 'none',
                            }}
                          >
                            {producto.textoBoton || 'Comprar'}
                          </button>
                        ) : (
                          <ActionableLink
                            href={producto.enlaceBoton || '#'}
                            onClick={(e) => handleProductClick(producto, e)}
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
                        )
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

      {showSchemeSelectorModal && selectedProductForScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={() => {
            setShowSchemeSelectorModal(false)
            setSelectedProductForScheme(null)
          }} />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)] animate-in fade-in zoom-in-95 duration-200">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
                Selección de Pago
              </p>
              <h3 className="mt-2 text-xl font-bold text-body">
                Selecciona la modalidad de pago
              </h3>
              <p className="mt-1 text-xs text-body-muted">
                Este producto ofrece múltiples planes de financiamiento. Elige el de tu preferencia para continuar.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {selectedProductForScheme.financingSchemes?.map((scheme: any) => {
                const isCash = scheme.paymentMode === 'cash'
                return (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => handleSelectSchemeAndProceed(scheme.id)}
                    className="w-full text-left p-4 border border-gray-200 hover:border-secondary/40 hover:bg-secondary/[0.02] rounded-2xl transition-all duration-200 cursor-pointer flex flex-col gap-1 group bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-body group-hover:text-secondary transition-colors">
                        {scheme.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                        {isCash ? 'Contado' : 'Crédito'}
                      </span>
                    </div>
                    <span className="text-xs text-body-muted">
                      {isCash 
                        ? 'Pago único completo e inmediato.'
                        : `Financiamiento en hasta ${scheme.maxQuotas} cuotas ${
                            scheme.paymentPeriod === 'monthly' ? 'mensuales' : 'periódicas'
                          }${scheme.initialPayment > 0 ? ` con inicial de ${scheme.initialPayment}%` : ''}.`
                      }
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowSchemeSelectorModal(false)
                  setSelectedProductForScheme(null)
                }}
                className="w-full py-2.5 text-center text-sm font-medium rounded-xl border border-gray-200 bg-white text-body hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  )
}
