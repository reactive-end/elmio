'use client'

import Link from 'next/link'
import { SectionContainer } from './SectionContainer'
import type { SeccionMarketplace, AliadoLogo } from '@/src/utils/editor-types.d'

interface PartnersSectionProps {
  seccion: SeccionMarketplace
}

/**
 * Renderiza un carrusel de aliados con efecto marquee de logos.
 */
export function PartnersSection({ seccion }: PartnersSectionProps) {
  const { contenido, estilo } = seccion
  const aliados = (contenido.aliados ?? []) as AliadoLogo[]
  if (aliados.length === 0) return null

  return (
    <SectionContainer estilo={estilo}>
      <div className="container mx-auto px-4">
        {(contenido.titulo || contenido.subtitulo) && (
          <div className="mb-8 text-center">
            {contenido.titulo && (
              <h2
                className="mb-2 text-2xl font-bold md:text-3xl"
                style={{ color: estilo.tituloColor, fontWeight: estilo.tituloPeso }}
              >
                {contenido.titulo}
              </h2>
            )}
            {contenido.subtitulo && (
              <p style={{ color: estilo.subtituloColor }}>{contenido.subtitulo}</p>
            )}
          </div>
        )}

        <div className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/6"
            style={{
              background: `linear-gradient(to right, ${estilo.colorFondo !== 'transparente' ? estilo.colorFondo : '#f8fafc'}, transparent)`,
            }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-1/6"
            style={{
              background: `linear-gradient(to left, ${estilo.colorFondo !== 'transparente' ? estilo.colorFondo : '#f8fafc'}, transparent)`,
            }}
          />

          <div className="flex gap-6 py-4" style={{ animation: 'marquee 40s linear infinite' }}>
            {[...aliados, ...aliados, ...aliados, ...aliados].map((aliado, idx) => (
              <Link
                key={`${aliado.id}-${idx}`}
                href={aliado.href || '#'}
                className="flex h-24 w-48 shrink-0 items-center justify-center rounded-lg bg-white px-8 py-6 shadow-sm transition-all hover:shadow-md"
              >
                {aliado.logo ? (
                  <img
                    src={aliado.logo}
                    alt={aliado.nombre}
                    className="max-h-12 max-w-full object-contain transition-all"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-400">{aliado.nombre}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </SectionContainer>
  )
}
