'use client'

import { SectionContainer } from './SectionContainer'
import type { SeccionMarketplace, PilarItem } from '@/src/utils/editor-types.d'

interface PillarsSectionProps {
  seccion: SeccionMarketplace
}

/**
 * Renderiza una grilla de pilares con iconos, titulos y botones de accion.
 */
export function PillarsSection({ seccion }: PillarsSectionProps) {
  const { contenido, estilo } = seccion
  const pilares = (contenido.pilares ?? []) as PilarItem[]
  if (pilares.length === 0) return null

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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pilares.map((pilar, idx) => (
            <div
              key={pilar.id ?? idx}
              className="flex flex-col items-center rounded-2xl bg-gray-50 p-6 text-center transition-all hover:shadow-md"
            >
              {pilar.icono ? (
                <img
                  src={pilar.icono}
                  alt={pilar.titulo}
                  className="mb-4 h-12 w-12 object-contain"
                />
              ) : (
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20 text-secondary">
                  <svg
                    width="24"
                    height="24"
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
              <h3
                className="mb-2 font-semibold"
                style={{ color: estilo.tituloColor, fontSize: 18 }}
              >
                {pilar.titulo}
              </h3>
              <p className="text-sm" style={{ color: estilo.cuerpoColor }}>
                {pilar.texto}
              </p>
              {pilar.textoBoton && (
                <button
                  type="button"
                  className="mt-4 rounded-xl px-5 py-2 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: estilo.botonColorFondo || '#0f4ece',
                    color: estilo.botonColorTexto || '#fff',
                    borderRadius: estilo.botonRedondez || 12,
                  }}
                >
                  {pilar.textoBoton}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  )
}
