'use client'

import * as Icons from 'lucide-react'
import { SectionContainer } from './SectionContainer'
import { ActionableLink } from '@/components/atoms/ActionableLink/ActionableLink'
import type { SeccionMarketplace, PilarItem } from '@/src/utils/editor-types.d'

interface PillarsSectionProps {
  seccion: SeccionMarketplace
}

/**
 * Renderiza una grilla de pilares con iconos, titulos y botones de accion.
 */
export function PillarsSection({ seccion }: PillarsSectionProps) {
  const { contenido, estilo } = seccion
  const items = seccion.tipo === 'caracteristicas' 
    ? (contenido.elementos ?? []) 
    : (contenido.pilares ?? [])
  if (items.length === 0) return null

  const isZigzag = estilo.layoutPilares === 'zigzag'

  // Distribución del grid inteligente según el número de elementos
  const gridColsClass = 
    items.length === 1 
      ? "grid-cols-1 max-w-xl mx-auto" 
      : items.length === 2 
        ? "sm:grid-cols-2 max-w-3xl mx-auto" 
        : items.length === 3 
          ? "sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto" 
          : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

  return (
    <SectionContainer estilo={estilo}>
      <div className="container mx-auto px-4">
        {(contenido.titulo || contenido.subtitulo) && (
          <div className="mb-10 text-center">
            {contenido.titulo && (
              <h2
                className="mb-2 text-2xl font-bold md:text-3xl"
                style={{ color: estilo.tituloColor }}
              >
                {contenido.titulo}
              </h2>
            )}
            {contenido.subtitulo && (
              <p style={{ color: estilo.subtituloColor }}>{contenido.subtitulo}</p>
            )}
          </div>
        )}

        <div className={isZigzag ? "flex flex-col gap-12" : `grid gap-6 ${gridColsClass}`}>
          {items.map((item: any, idx) => (
            <div
              key={item.id ?? idx}
              className={`flex p-6 transition-all hover:shadow-md ${
                isZigzag 
                  ? `flex-col sm:flex-row items-center text-left ${idx % 2 !== 0 ? 'sm:flex-row-reverse' : ''} gap-8` 
                  : 'flex-col items-center text-center'
              }`}
              style={{
                backgroundColor: estilo.tarjetaColorFondo || '#f9fafb',
                borderRadius: estilo.tarjetaRadioBorde !== undefined ? estilo.tarjetaRadioBorde : 16,
                borderWidth: estilo.tarjetaAnchoBorde !== undefined ? estilo.tarjetaAnchoBorde : 0,
                borderColor: estilo.tarjetaColorBorde || 'transparent',
                borderStyle: (estilo.tarjetaAnchoBorde ?? 0) > 0 ? 'solid' : 'none',
              }}
            >
              {item.icono ? (
                <div className={isZigzag ? "w-1/3 shrink-0" : ""}>
                  {(() => {
                    const LucideIcon = (Icons as any)[item.icono]
                    if (LucideIcon) {
                      return (
                        <LucideIcon
                          className={`mb-4 text-secondary shrink-0 ${
                            isZigzag ? 'h-16 w-16 mx-auto sm:mx-0' : 'h-12 w-12 mx-auto'
                          }`}
                          strokeWidth={1.5}
                        />
                      )
                    }
                    return (
                      <img
                        src={item.icono}
                        alt={item.titulo}
                        className={`mb-4 object-contain ${
                          isZigzag ? 'h-32 w-full object-center' : 'h-12 w-12 mx-auto'
                        }`}
                      />
                    )
                  })()}
                </div>
              ) : (
                <div
                  className={`mb-4 flex items-center justify-center rounded-full bg-secondary/20 text-secondary shrink-0 ${
                    isZigzag ? 'h-24 w-24' : 'h-12 w-12'
                  }`}
                >
                  <svg
                    width={isZigzag ? "48" : "24"}
                    height={isZigzag ? "48" : "24"}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
              )}
              <div className="flex flex-col flex-1 w-full">
                <h3
                  className="mb-2 font-semibold"
                  style={{ color: estilo.pilarTituloColor || estilo.tituloColor || '#111827', fontSize: 18 }}
                >
                  {item.titulo}
                </h3>
                <p className="text-sm" style={{ color: estilo.cuerpoColor }}>
                  {item.texto || item.descripcion}
                </p>
                {item.textoBoton && item.enlaceBoton && (
                  <div className={isZigzag ? "mt-4 text-left" : "mt-4"}>
                    <ActionableLink
                      href={item.enlaceBoton}
                      className="inline-block px-5 py-2 text-sm font-semibold transition-colors"
                      style={{
                        backgroundColor: estilo.botonColorFondo || '#0f4ece',
                        color: estilo.botonColorTexto || '#fff',
                        borderRadius: estilo.botonRedondez !== undefined ? estilo.botonRedondez : 12,
                        borderWidth: estilo.botonAnchoBorde !== undefined ? estilo.botonAnchoBorde : 0,
                        borderColor: estilo.botonColorBorde || estilo.botonColorFondo || '#0f4ece',
                        borderStyle: (estilo.botonAnchoBorde ?? 0) > 0 ? 'solid' : 'none',
                      }}
                    >
                      {item.textoBoton}
                    </ActionableLink>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  )
}
