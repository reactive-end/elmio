'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SectionContainer } from './SectionContainer'
import type { SeccionMarketplace, Diapositiva } from '@/src/utils/editor-types.d'

interface StripSectionProps {
  seccion: SeccionMarketplace
}

/**
 * Renderiza una franja animada con slides de altura fija, navegacion y botones.
 */
export function StripSection({ seccion }: StripSectionProps) {
  const { contenido, estilo } = seccion
  const slides = contenido.diapositivas as Diapositiva[]

  const autoplay = contenido.autoplay !== false
  const velocidad = contenido.autoplayVelocidad || 5000
  const alto = 250

  const [indiceActual, setIndiceActual] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const iniciarAuto = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (autoplay && slides.length > 1) {
      intervalRef.current = setInterval(() => {
        setIndiceActual((prev) => (prev + 1) % slides.length)
      }, velocidad)
    }
  }, [autoplay, slides.length, velocidad])

  useEffect(() => {
    iniciarAuto()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [iniciarAuto])

  if (slides.length === 0) return null

  return (
    <SectionContainer estilo={{ ...estilo, paddingSuperior: 0, paddingInferior: 0, paddingDerecho: 0, paddingIzquierdo: 0 }}>
      <div className="relative overflow-hidden" style={{ height: alto }}>
        <div className="absolute inset-0 flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${indiceActual * 100}%)` }}>
          {slides.map((slide, idx) => (
            <div key={slide.id ?? idx} className="relative h-full w-full shrink-0">
              {slide.imagen ? (
                <img src={slide.imagen} alt={slide.titulo ?? `Strip ${idx}`} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full" style={{ backgroundColor: estilo.colorFondo !== 'transparente' ? estilo.colorFondo : '#1E40AF' }} />
              )}
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <div className="max-w-3xl text-center">
                  {slide.titulo && <h3 className="mb-1 text-lg font-bold md:text-xl" style={{ color: estilo.tituloColor || '#fff' }}>{slide.titulo}</h3>}
                  {slide.texto && <p className="mb-3 text-sm md:text-base" style={{ color: estilo.cuerpoColor || 'rgba(255,255,255,0.9)' }}>{slide.texto}</p>}
                  {slide.textoBoton && (
                    <button type="button" className="inline-block rounded-xl px-5 py-2 font-medium transition-colors"
                      style={{ backgroundColor: estilo.botonColorFondo || '#FBBF24', color: estilo.botonColorTexto || '#1E40AF', borderRadius: estilo.botonRedondez || 8 }}>
                      {slide.textoBoton}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <>
            <button type="button" onClick={() => { setIndiceActual((prev) => (prev - 1 + slides.length) % slides.length); iniciarAuto() }}
              className="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow transition-all hover:bg-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button type="button" onClick={() => { setIndiceActual((prev) => (prev + 1) % slides.length); iniciarAuto() }}
              className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow transition-all hover:bg-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </>
        )}
      </div>
    </SectionContainer>
  )
}
