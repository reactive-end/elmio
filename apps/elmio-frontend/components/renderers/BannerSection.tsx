'use client'

import Link from 'next/link'
import { SectionContainer } from './SectionContainer'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface BannerSectionProps {
  seccion: SeccionMarketplace
}

/**
 * Renderiza una seccion banner con texto e imagen posicionable a izquierda o derecha.
 */
export function BannerSection({ seccion }: BannerSectionProps) {
  const { contenido, estilo } = seccion
  const imagenDerecha =
    (contenido as unknown as Record<string, string>).imagenPosicion !== 'izquierda'

  return (
    <SectionContainer estilo={estilo}>
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-8 md:grid-cols-2">
          {imagenDerecha ? (
            <>
              <div className="flex flex-col gap-5" style={{ textAlign: 'left' }}>
                {contenido.titulo && (
                  <h2
                    className="font-bold"
                    style={{ fontSize: estilo.tituloTamano, color: estilo.tituloColor }}
                  >
                    {contenido.titulo}
                  </h2>
                )}
                {contenido.descripcion && (
                  <p
                    className="max-w-xl"
                    style={{ fontSize: estilo.cuerpoTamano, color: estilo.cuerpoColor }}
                  >
                    {contenido.descripcion}
                  </p>
                )}
                {contenido.textoBoton && contenido.enlaceBoton && (
                  <Link
                    href={contenido.enlaceBoton}
                    className="inline-flex items-center self-start rounded-xl px-6 py-3 font-semibold transition-transform hover:scale-105"
                    style={{
                      backgroundColor: estilo.botonColorFondo || '#0f4ece',
                      color: estilo.botonColorTexto || '#fff',
                      borderRadius: estilo.botonRedondez || 12,
                    }}
                  >
                    {contenido.textoBoton}
                  </Link>
                )}
              </div>
              {contenido.imagenUrl && (
                <div className="w-full">
                  <img
                    src={contenido.imagenUrl}
                    alt={contenido.titulo}
                    className="h-40 w-full rounded-2xl bg-white object-contain shadow-sm md:h-72 md:object-cover"
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {contenido.imagenUrl && (
                <div className="w-full">
                  <img
                    src={contenido.imagenUrl}
                    alt={contenido.titulo}
                    className="h-40 w-full rounded-2xl bg-white object-contain shadow-sm md:h-72 md:object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col gap-5" style={{ textAlign: 'left' }}>
                {contenido.titulo && (
                  <h2
                    className="font-bold"
                    style={{ fontSize: estilo.tituloTamano, color: estilo.tituloColor }}
                  >
                    {contenido.titulo}
                  </h2>
                )}
                {contenido.descripcion && (
                  <p
                    className="max-w-xl"
                    style={{ fontSize: estilo.cuerpoTamano, color: estilo.cuerpoColor }}
                  >
                    {contenido.descripcion}
                  </p>
                )}
                {contenido.textoBoton && contenido.enlaceBoton && (
                  <Link
                    href={contenido.enlaceBoton}
                    className="inline-flex items-center self-start rounded-xl px-6 py-3 font-semibold transition-transform hover:scale-105"
                    style={{
                      backgroundColor: estilo.botonColorFondo || '#0f4ece',
                      color: estilo.botonColorTexto || '#fff',
                      borderRadius: estilo.botonRedondez || 12,
                    }}
                  >
                    {contenido.textoBoton}
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </SectionContainer>
  )
}
