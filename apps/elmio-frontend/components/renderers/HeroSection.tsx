'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ActionableLink } from '@/components/atoms/ActionableLink/ActionableLink'
import { SectionContainer } from './SectionContainer'
import type { SeccionMarketplace, Diapositiva } from '@/src/utils/editor-types.d'

interface HeroSectionProps {
  seccion: SeccionMarketplace
}

/**
 * Renderiza la seccion principal tipo hero con carrusel de slides, autoplay y navegacion.
 */
export function HeroSection({ seccion }: HeroSectionProps) {
  const { contenido, estilo } = seccion
  const slides =
    contenido.diapositivas.length > 0
      ? contenido.diapositivas
      : ([
          {
            id: 'default-hero',
            imagen: contenido.imagenUrl,
            titulo: contenido.titulo,
            subtitulo: contenido.subtitulo,
            texto: contenido.descripcion,
            textoBoton: contenido.textoBoton,
            enlaceBoton: contenido.enlaceBoton,
          },
        ].filter((s) => s.imagen || s.titulo) as Diapositiva[])

  const [indiceActual, setIndiceActual] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const velocidad = contenido.autoplayVelocidad || 5000
  const autoActivo = contenido.autoplay !== false && slides.length > 1

  const iniciarAuto = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (autoActivo) {
      intervalRef.current = setInterval(() => {
        setIndiceActual((prev) => (prev + 1) % slides.length)
      }, velocidad)
    }
  }, [autoActivo, slides.length, velocidad])

  useEffect(() => {
    iniciarAuto()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [iniciarAuto])

  const slideActual = slides[indiceActual] ?? slides[0]
  if (!slideActual) return null

  return (
    <SectionContainer
      estilo={{
        ...estilo,
        paddingSuperior: 0,
        paddingInferior: 0,
        paddingDerecho: 0,
        paddingIzquierdo: 0,
      }}
    >
      <div className="relative flex h-[300px] items-center justify-center overflow-hidden md:h-[520px]">
        <div
          className="absolute inset-0 flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${indiceActual * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <div key={slide.id ?? idx} className="h-full w-full shrink-0 relative">
              {slide.imagen ? (
                <img
                  src={slide.imagen}
                  alt={slide.titulo ?? `Slide ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-secondary-dark">
                  <span className="text-2xl font-bold text-white">{slide.titulo ?? 'Slide'}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          className={`relative z-10 flex w-full flex-col px-8 py-16 ${
            estilo.layoutPrincipal === 'dividido' 
              ? 'max-w-7xl items-start text-left bg-gradient-to-r from-black/60 to-transparent h-full justify-center w-full' 
              : 'max-w-4xl items-center text-center'
          }`}
        >
          {slideActual.titulo && (
            <h1
              className="mb-3 font-bold text-white drop-shadow-lg"
              style={{ fontSize: estilo.tituloTamano, fontWeight: estilo.tituloPeso }}
            >
              {slideActual.titulo}
            </h1>
          )}
          {slideActual.subtitulo && (
            <p
              className="mb-2 text-lg text-white/80 drop-shadow"
              style={{ fontSize: estilo.subtituloTamano }}
            >
              {slideActual.subtitulo}
            </p>
          )}
          {slideActual.texto && (
            <p
              className="mb-6 max-w-2xl text-white/70 drop-shadow"
              style={{ fontSize: estilo.cuerpoTamano }}
            >
              {slideActual.texto}
            </p>
          )}
          {slideActual.textoBoton && slideActual.enlaceBoton && (
            <ActionableLink
              href={slideActual.enlaceBoton}
              className="inline-flex items-center rounded-xl px-6 py-3 font-semibold shadow-lg transition-transform hover:scale-105"
              style={{
                backgroundColor: estilo.botonColorFondo || '#0f4ece',
                color: estilo.botonColorTexto || '#fff',
                borderRadius: estilo.botonRedondez || 12,
              }}
            >
              {slideActual.textoBoton}
            </ActionableLink>
          )}
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => {
                setIndiceActual((prev) => (prev - 1 + slides.length) % slides.length)
                iniciarAuto()
              }}
              className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow transition-all hover:bg-white hover:scale-110 md:left-8 md:h-14 md:w-14"
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
              onClick={() => {
                setIndiceActual((prev) => (prev + 1) % slides.length)
                iniciarAuto()
              }}
              className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow transition-all hover:bg-white hover:scale-110 md:right-8 md:h-14 md:w-14"
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
            <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIndiceActual(idx)
                    iniciarAuto()
                  }}
                  className={`rounded-full transition-all duration-300 ${idx === indiceActual ? 'h-3 w-8 bg-white' : 'h-3 w-3 bg-white/50 hover:bg-white/70'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </SectionContainer>
  )
}
