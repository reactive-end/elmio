'use client'

import Link from 'next/link'
import { ActionableLink } from '@/components/atoms/ActionableLink/ActionableLink'
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

  const titulo = contenido.titulo || 'Banner Informativo'
  const descripcion = contenido.descripcion || 'Personaliza el texto de este banner utilizando el editor lateral del configurador.'
  const imagenUrl = contenido.imagenUrl || ''
  const textoBoton = contenido.textoBoton || ''
  const enlaceBoton = contenido.enlaceBoton || '#'

  const alignValue = estilo.cuerpoAlineacion === 'centro' ? 'center' : estilo.cuerpoAlineacion === 'derecha' ? 'right' : 'left'
  const flexAlignValue = estilo.cuerpoAlineacion === 'centro' ? 'center' : estilo.cuerpoAlineacion === 'derecha' ? 'flex-end' : 'flex-start'

  return (
    <SectionContainer estilo={estilo}>
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-8 md:grid-cols-2">
          {imagenDerecha ? (
            <>
              <div className="flex flex-col gap-5" style={{ textAlign: alignValue, alignItems: flexAlignValue }}>
                <h2
                  className="font-bold tracking-tight"
                  style={{ fontSize: estilo.tituloTamano, color: estilo.tituloColor || '#111827' }}
                >
                  {titulo}
                </h2>
                <p
                  className="max-w-xl text-sm font-medium leading-relaxed"
                  style={{ fontSize: estilo.cuerpoTamano, color: estilo.cuerpoColor || '#4b5563' }}
                >
                  {descripcion}
                </p>
                {textoBoton && (
                  <ActionableLink
                    href={enlaceBoton}
                    className="inline-flex items-center px-6 py-3 font-semibold shadow transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: estilo.botonColorFondo || '#0f4ece',
                      color: estilo.botonColorTexto || '#fff',
                      borderRadius: estilo.botonRedondez !== undefined ? estilo.botonRedondez : 12,
                      borderWidth: estilo.botonAnchoBorde !== undefined ? estilo.botonAnchoBorde : 0,
                      borderColor: estilo.botonColorBorde || estilo.botonColorFondo || '#0f4ece',
                      borderStyle: (estilo.botonAnchoBorde ?? 0) > 0 ? 'solid' : 'none',
                    }}
                  >
                    {textoBoton}
                  </ActionableLink>
                )}
              </div>
              
              <div className="w-full">
                {imagenUrl ? (
                   <img
                    src={imagenUrl}
                    alt={titulo}
                    className="h-48 w-full rounded-2xl bg-white object-cover shadow-md md:h-80 transition-transform duration-500 hover:scale-[1.01]"
                  />
                ) : (
                  <div className="h-48 w-full rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 gap-2 md:h-80 shadow-inner">
                    <svg className="w-8 h-8 opacity-40 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
                    </svg>
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Imagen del Banner</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-full">
                {imagenUrl ? (
                  <img
                    src={imagenUrl}
                    alt={titulo}
                    className="h-48 w-full rounded-2xl bg-white object-cover shadow-md md:h-80 transition-transform duration-500 hover:scale-[1.01]"
                  />
                ) : (
                  <div className="h-48 w-full rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 gap-2 md:h-80 shadow-inner">
                    <svg className="w-8 h-8 opacity-40 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
                    </svg>
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Imagen del Banner</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-5" style={{ textAlign: alignValue, alignItems: flexAlignValue }}>
                <h2
                  className="font-bold tracking-tight"
                  style={{ fontSize: estilo.tituloTamano, color: estilo.tituloColor || '#111827' }}
                >
                  {titulo}
                </h2>
                <p
                  className="max-w-xl text-sm font-medium leading-relaxed"
                  style={{ fontSize: estilo.cuerpoTamano, color: estilo.cuerpoColor || '#4b5563' }}
                >
                  {descripcion}
                </p>
                {textoBoton && (
                  <ActionableLink
                    href={enlaceBoton}
                    className="inline-flex items-center px-6 py-3 font-semibold shadow transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: estilo.botonColorFondo || '#0f4ece',
                      color: estilo.botonColorTexto || '#fff',
                      borderRadius: estilo.botonRedondez !== undefined ? estilo.botonRedondez : 12,
                      borderWidth: estilo.botonAnchoBorde !== undefined ? estilo.botonAnchoBorde : 0,
                      borderColor: estilo.botonColorBorde || estilo.botonColorFondo || '#0f4ece',
                      borderStyle: (estilo.botonAnchoBorde ?? 0) > 0 ? 'solid' : 'none',
                    }}
                  >
                    {textoBoton}
                  </ActionableLink>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </SectionContainer>
  )
}
