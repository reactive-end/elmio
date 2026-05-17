'use client'

import { SectionContainer } from './SectionContainer'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface InfoTextSectionProps {
  seccion: SeccionMarketplace
}

/**
 * Renderiza una seccion de texto informativo enriquecido con titulo y cuerpo HTML.
 */
export function InfoTextSection({ seccion }: InfoTextSectionProps) {
  const { contenido, estilo } = seccion

  return (
    <SectionContainer estilo={estilo} id={contenido.htmlId || undefined}>
      <div className="container mx-auto px-4">
        {contenido.titulo && (
          <h2
            className="mb-3 font-bold"
            style={{
              color: estilo.tituloColor,
              fontSize: estilo.tituloTamano,
              textAlign: estilo.tituloAlineacion as never,
            }}
          >
            {contenido.titulo}
          </h2>
        )}
        {contenido.subtitulo && (
          <h3
            className="mb-4 text-lg"
            style={{ color: estilo.subtituloColor, textAlign: estilo.tituloAlineacion as never }}
          >
            {contenido.subtitulo}
          </h3>
        )}
        {contenido.cuerpoHtml ? (
          <div
            className="prose max-w-none"
            style={{ color: estilo.cuerpoColor, textAlign: estilo.cuerpoAlineacion as never }}
            dangerouslySetInnerHTML={{ __html: contenido.cuerpoHtml }}
          />
        ) : contenido.descripcion ? (
          <div
            className="max-w-3xl leading-relaxed"
            style={{
              color: estilo.cuerpoColor,
              fontSize: estilo.cuerpoTamano,
              textAlign: estilo.cuerpoAlineacion as never,
            }}
          >
            {contenido.descripcion}
          </div>
        ) : null}
      </div>
    </SectionContainer>
  )
}
