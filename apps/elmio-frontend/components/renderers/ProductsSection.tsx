'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { SectionContainer } from './SectionContainer'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface ProductsSectionProps {
  seccion: SeccionMarketplace
}

/**
 * Renderiza la seccion de productos con carrusel horizontal navegable.
 */
export function ProductsSection({ seccion }: ProductsSectionProps) {
  const { contenido, estilo } = seccion
  const productos = contenido.elementos
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

  const desplazarA = useCallback((idx: number) => {
    const limite = Math.max(0, Math.min(idx, maxIndice))
    setIndiceActual(limite)
    if (trackRef.current) trackRef.current.style.transform = `translateX(${-(limite * paso)}px)`
  }, [maxIndice, paso])

  useEffect(() => {
    if (!autoplay || !puedeAvanzar) return
    intervalRef.current = setInterval(() => {
      setIndiceActual((prev) => {
        const next = prev >= maxIndice ? 0 : prev + 1
        if (trackRef.current) trackRef.current.style.transform = `translateX(${-(next * paso)}px)`
        return next
      })
    }, velocidad)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoplay, puedeAvanzar, maxIndice, velocidad, paso])

  if (productos.length === 0) return null

  return (
    <SectionContainer estilo={estilo} id={contenido.htmlId || undefined}>
      <div className="mx-auto px-4">
        {contenido.titulo && (
          <h2 className="mb-8 text-3xl font-bold" style={{ color: estilo.tituloColor, textAlign: estilo.tituloAlineacion as never }}>
            {contenido.titulo}
          </h2>
        )}

        <div className="relative mx-auto" style={{ maxWidth: tarjetasPorVista * paso }}>
          {puedeAvanzar && (
            <>
              <button type="button" onClick={() => desplazarA(indiceActual - 1)} disabled={indiceActual === 0}
                className="absolute -left-6 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gray-200 bg-white shadow-lg transition-all hover:scale-110 disabled:opacity-50 md:flex">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button type="button" onClick={() => desplazarA(indiceActual + 1)} disabled={indiceActual >= maxIndice}
                className="absolute -right-6 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gray-200 bg-white shadow-lg transition-all hover:scale-110 disabled:opacity-50 md:flex">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
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
                <div key={producto.id} className="shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                  style={{ width: anchoTarjeta }}>
                  <div className="relative h-32 bg-gray-100" style={{ height: estilo.altoImagenProducto || 200 }}>
                    {producto.imagenUrl ? (
                      <img src={producto.imagenUrl} alt={producto.titulo} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">Sin imagen</div>
                    )}
                  </div>
                  <div className="p-4">
                    {producto.enlaceUrl && (
                      <span className="mb-2 inline-block rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-semibold text-secondary"
                        style={{ borderRadius: estilo.botonRedondez || 8 }}>
                        {producto.enlaceUrl}
                      </span>
                    )}
                    <h4 className="text-sm font-semibold text-body line-clamp-2">{producto.titulo}</h4>
                    {producto.descripcion && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{producto.descripcion}</p>
                    )}
                    <div className="mt-auto pt-3">
                      {producto.enlaceBoton ? (
                        <Link href={producto.enlaceBoton}
                          className="block w-full rounded-xl py-2 text-center text-sm font-medium transition-colors"
                          style={{ backgroundColor: estilo.botonColorFondo || '#0f4ece', color: estilo.botonColorTexto || '#fff', borderRadius: estilo.botonRedondez || 12 }}>
                          {producto.textoBoton || 'Ver detalle'}
                        </Link>
                      ) : (
                        <button type="button"
                          className="block w-full rounded-xl py-2 text-center text-sm font-medium transition-colors"
                          style={{ backgroundColor: estilo.botonColorFondo || '#0f4ece', color: estilo.botonColorTexto || '#fff', borderRadius: estilo.botonRedondez || 12 }}>
                          {producto.textoBoton || 'Ver detalle'}
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
            <Link href={contenido.enlaceBoton}
              className="inline-flex items-center rounded-xl px-6 py-3 font-semibold shadow transition-transform hover:scale-105"
              style={{ backgroundColor: estilo.botonColorFondo || '#0f4ece', color: estilo.botonColorTexto || '#fff', borderRadius: estilo.botonRedondez || 12 }}>
              {contenido.textoBoton}
            </Link>
          </div>
        )}
      </div>
    </SectionContainer>
  )
}
