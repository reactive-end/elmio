'use client'

import Link from 'next/link'
import { ActionableLink } from '@/components/atoms/ActionableLink/ActionableLink'
import { SectionContainer } from './SectionContainer'
import type { SeccionMarketplace, ElementoSeccion } from '@/src/utils/editor-types.d'

interface DualBannerSectionProps {
  seccion: SeccionMarketplace
}

/**
 * Renderiza dos banners lado a lado con imagen, texto y boton por tarjeta.
 */
export function DualBannerSection({ seccion }: DualBannerSectionProps) {
  const { contenido, estilo } = seccion
  const banners = contenido.elementos.slice(0, 2) as ElementoSeccion[]

  if (banners.length < 2) return null

  return (
    <SectionContainer estilo={estilo}>
      <div className="container mx-auto px-4">
        <div className={`grid gap-6 ${
          estilo.proporcionColumnas === '60/40' ? 'md:grid-cols-[3fr_2fr]' :
          estilo.proporcionColumnas === '30/70' ? 'md:grid-cols-[3fr_7fr]' :
          'md:grid-cols-2'
        }`}>
          {banners.map((banner, idx) => (
            <div
              key={banner.id ?? idx}
              className="group relative overflow-hidden rounded-2xl"
              style={{ minHeight: 280 }}
            >
              {banner.imagenUrl ? (
                <img
                  src={banner.imagenUrl}
                  alt={banner.titulo}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-secondary to-secondary-dark" />
              )}
              <div
                className="absolute inset-0 flex flex-col justify-end p-6 md:p-8"
                style={{ color: estilo.tituloColor || '#fff' }}
              >
                <h3 className="text-xl font-bold md:text-2xl">{banner.titulo}</h3>
                {banner.descripcion && (
                  <p className="mt-2 text-sm opacity-90">{banner.descripcion}</p>
                )}
                {banner.textoBoton && banner.enlaceBoton && (
                  <ActionableLink
                    href={banner.enlaceBoton}
                    className="mt-4 inline-flex items-center self-start rounded-xl px-5 py-2 font-semibold transition-transform hover:scale-105"
                    style={{
                      backgroundColor: estilo.botonColorFondo || '#fff',
                      color: estilo.botonColorTexto || '#111827',
                      borderRadius: estilo.botonRedondez || 12,
                    }}
                  >
                    {banner.textoBoton}
                  </ActionableLink>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  )
}
