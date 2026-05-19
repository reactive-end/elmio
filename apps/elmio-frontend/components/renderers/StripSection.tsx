'use client'

import Link from 'next/link'
import { ActionableLink } from '@/components/atoms/ActionableLink/ActionableLink'
import { SectionContainer } from './SectionContainer'
import type { SeccionMarketplace, Diapositiva } from '@/src/utils/editor-types.d'

interface StripSectionProps {
  seccion: SeccionMarketplace
}

/**
 * Renderiza una franja animada con efecto marquee usando CSS puro para rendimiento optimo.
 */
export function StripSection({ seccion }: StripSectionProps) {
  const { contenido, estilo } = seccion
  const slides = (contenido.diapositivas ?? []) as Diapositiva[]

  const autoplay = contenido.autoplay !== false
  const duracionEnSegundos = Math.max(10, (contenido.autoplayVelocidad || 5000) / 100)

  if (slides.length === 0) return null

  return (
    <SectionContainer
      estilo={{
        ...estilo,
        paddingSuperior: 16,
        paddingInferior: 16,
      }}
    >
      <div className="relative overflow-hidden w-full flex items-center">
        {/* Sombras difuminadas en los bordes para un look premium */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 md:w-32"
          style={{
            background: `linear-gradient(to right, ${estilo.colorFondo !== 'transparente' ? estilo.colorFondo : '#ffffff'}, transparent)`,
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 md:w-32"
          style={{
            background: `linear-gradient(to left, ${estilo.colorFondo !== 'transparente' ? estilo.colorFondo : '#ffffff'}, transparent)`,
          }}
        />

        <div 
          className={`flex gap-12 whitespace-nowrap items-center ${autoplay ? 'animate-strip-marquee' : ''}`}
          style={{ animationDuration: `${duracionEnSegundos}s` }}
        >
          {/* Se duplican para generar el ciclo infinito */}
          {[...slides, ...slides, ...slides, ...slides].map((slide, idx) => (
            <div key={`${slide.id ?? idx}-${idx}`} className="flex items-center gap-4 shrink-0">
              {slide.imagen && (
                <img
                  src={slide.imagen}
                  alt={slide.titulo ?? `Item ${idx}`}
                  className="h-8 w-auto object-contain rounded"
                />
              )}
              {slide.titulo && (
                <span
                  className="font-semibold text-lg"
                  style={{ color: estilo.tituloColor || '#1f2937' }}
                >
                  {slide.titulo}
                </span>
              )}
              {slide.texto && (
                <span
                  className="text-sm font-medium"
                  style={{ color: estilo.cuerpoColor || '#4b5563' }}
                >
                  {slide.texto}
                </span>
              )}
              {slide.textoBoton && slide.enlaceBoton && (
                <ActionableLink
                  href={slide.enlaceBoton}
                  className="text-sm font-bold hover:opacity-80 transition-opacity ml-2"
                  style={{ color: estilo.botonColorFondo || '#3b82f6' }}
                >
                  {slide.textoBoton} &rarr;
                </ActionableLink>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes strip-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-strip-marquee {
          animation: strip-marquee linear infinite;
        }
        .animate-strip-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </SectionContainer>
  )
}
