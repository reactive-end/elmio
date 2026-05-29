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
 * Soporta de forma defensiva mapeos tanto en español como inglés.
 */
export function DualBannerSection({ seccion }: DualBannerSectionProps) {
  const { contenido, estilo } = seccion
  
  // Mapear de forma defensiva en caliente para tolerar claves en inglés y español
  const rawBanners = (contenido.elementos ?? (contenido as any).elements ?? []) as any[]
  
  // Asegurar siempre exactamente 2 elementos con fallbacks/placeholders elegantes
  const banners = Array.from({ length: 2 }).map((_, idx) => {
    const b = rawBanners[idx]
    if (b) {
      return {
        id: b.id,
        titulo: b.titulo ?? b.title ?? (idx === 0 ? 'Primer Banner' : 'Segundo Banner'),
        descripcion: b.descripcion ?? b.description ?? '',
        imagenUrl: b.imagenUrl ?? b.imageUrl ?? '',
        textoBoton: b.textoBoton ?? b.buttonText ?? '',
        enlaceBoton: b.enlaceBoton ?? b.buttonLink ?? '',
      }
    } else {
      return {
        id: `placeholder-${idx}`,
        titulo: idx === 0 ? 'Primer Banner (Pendiente)' : 'Segundo Banner (Pendiente)',
        descripcion: 'Completa la información e imagen de este banner desde el editor de secciones.',
        imagenUrl: '',
        textoBoton: 'Configurar',
        enlaceBoton: '#',
      }
    }
  })

  const alignValue = estilo.cuerpoAlineacion === 'centro' ? 'center' : estilo.cuerpoAlineacion === 'derecha' ? 'right' : 'left'
  const flexAlignValue = estilo.cuerpoAlineacion === 'centro' ? 'center' : estilo.cuerpoAlineacion === 'derecha' ? 'flex-end' : 'flex-start'

  return (
    <SectionContainer estilo={estilo}>
      <div className="container mx-auto px-4">
        <div className={`grid gap-6 ${
          estilo.proporcionColumnas === '60/40' ? 'md:grid-cols-[3fr_2fr]' :
          estilo.proporcionColumnas === '40/60' ? 'md:grid-cols-[2fr_3fr]' :
          estilo.proporcionColumnas === '30/70' ? 'md:grid-cols-[3fr_7fr]' :
          estilo.proporcionColumnas === '70/30' ? 'md:grid-cols-[7fr_3fr]' :
          estilo.proporcionColumnas === '25/75' ? 'md:grid-cols-[1fr_3fr]' :
          estilo.proporcionColumnas === '75/25' ? 'md:grid-cols-[3fr_1fr]' :
          'md:grid-cols-2'
        }`}>
          {banners.map((banner, idx) => (
            <div
              key={banner.id ?? idx}
              className={`group relative overflow-hidden transition-all duration-300 ${
                String(estilo.mostrarSombra) === 'true' ? 'shadow-md hover:shadow-xl' : ''
              }`}
              style={{
                minHeight: 280,
                backgroundColor: estilo.tarjetaColorFondo || 'transparent',
                borderRadius: estilo.tarjetaRadioBorde !== undefined ? estilo.tarjetaRadioBorde : 16,
                borderWidth: estilo.tarjetaAnchoBorde !== undefined ? estilo.tarjetaAnchoBorde : 0,
                borderColor: estilo.tarjetaColorBorde || 'transparent',
                borderStyle: (estilo.tarjetaAnchoBorde ?? 0) > 0 ? 'solid' : 'none',
              }}
            >
              {banner.imagenUrl ? (
                <img
                  src={banner.imagenUrl}
                  alt={banner.titulo}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 opacity-90 transition-all duration-300 group-hover:scale-105" />
              )}
              
              {/* Overlay de gradiente oscuro para asegurar legibilidad */}
              {String(estilo.mostrarSombra) === 'true' && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              )}

              <div
                className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 z-10"
                style={{
                  color: estilo.tituloColor || '#fff',
                  textAlign: alignValue,
                  alignItems: flexAlignValue,
                }}
              >
                <h3 className="text-xl font-bold md:text-2xl tracking-tight leading-tight">
                  {banner.titulo}
                </h3>
                {banner.descripcion && (
                  <p className="mt-2 text-xs md:text-sm font-medium opacity-85 leading-relaxed max-w-md">
                    {banner.descripcion}
                  </p>
                )}
                {banner.textoBoton && (
                  <ActionableLink
                    href={banner.enlaceBoton || '#'}
                    className="mt-4 inline-flex items-center px-5 py-2 font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: estilo.botonColorFondo || '#fff',
                      color: estilo.botonColorTexto || '#111827',
                      borderRadius: estilo.botonRedondez !== undefined ? estilo.botonRedondez : 12,
                      borderWidth: estilo.botonAnchoBorde !== undefined ? estilo.botonAnchoBorde : 0,
                      borderColor: estilo.botonColorBorde || estilo.botonColorFondo || '#fff',
                      borderStyle: (estilo.botonAnchoBorde ?? 0) > 0 ? 'solid' : 'none',
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
