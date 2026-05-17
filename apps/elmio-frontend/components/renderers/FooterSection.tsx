'use client'

import Link from 'next/link'
import { SectionContainer } from './SectionContainer'
import type { SeccionMarketplace, ColumnaPie } from '@/src/utils/editor-types.d'

interface FooterSectionProps {
  seccion: SeccionMarketplace
}

const SOCIAL_ICONS: Record<string, string> = {
  instagram: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01',
  facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
  linkedin: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  twitter: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z',
  youtube: 'M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17 M10 15l5-3-5-3z',
}

function esColumnaSocial(titulo: string): boolean {
  return ['redes', 'social', 'siguenos'].some((palabra) => titulo.toLowerCase().includes(palabra))
}

/**
 * Renderiza el pie de pagina con logo, columnas de enlaces y redes sociales.
 */
export function FooterSection({ seccion }: FooterSectionProps) {
  const { contenido, estilo } = seccion
  const columnas = (contenido.columnasPie ?? []) as ColumnaPie[]
  const logo = contenido.logoUrl || '/logo.svg'
  const descripcion = contenido.descripcion || contenido.subtitulo
  const copyright = contenido.copyright || '2026 ElMio. Todos los derechos reservados.'

  return (
    <SectionContainer estilo={estilo}>
      <div className="container mx-auto px-4">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            {logo && <img src={logo} alt="Logo" className="h-10 w-auto brightness-0 invert" />}
            {descripcion && (
              <p className="mt-4 text-sm leading-relaxed" style={{ color: estilo.cuerpoColor }}>
                {descripcion}
              </p>
            )}
          </div>

          <div className="grid gap-8 md:col-span-3 md:grid-cols-3">
            {columnas.map((col) => {
              const social = esColumnaSocial(col.titulo)
              return (
                <div key={col.id}>
                  <p className="mb-3 font-semibold" style={{ color: estilo.tituloColor }}>{col.titulo}</p>
                  {social ? (
                    <div className="flex items-center gap-3">
                      {col.enlaces.map((link) => {
                        const key = link.texto.toLowerCase().replace(/[^a-z]/g, '')
                        const pathData = SOCIAL_ICONS[key]
                        return (
                          <Link key={link.id} href={link.href} className="rounded-full p-2 transition-opacity hover:opacity-80" style={{ color: estilo.tituloColor }}>
                            {pathData ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={pathData}/></svg>
                            ) : (
                              <span className="text-sm">{link.texto}</span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {col.enlaces.map((link) => (
                        <Link key={link.id} href={link.href} className="text-sm transition-opacity hover:opacity-80" style={{ color: estilo.cuerpoColor }}>
                          {link.texto}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-sm" style={{ color: estilo.cuerpoColor }}>{copyright}</p>
          {contenido.enlaceBoton && (
            <div className="flex gap-4 text-sm">
              {[{ id: 'terms', texto: 'Terminos', href: '/terminos' }, { id: 'privacy', texto: 'Privacidad', href: '/privacidad' }].map((link) => (
                <Link key={link.id} href={link.href} className="transition-opacity hover:opacity-80" style={{ color: estilo.cuerpoColor }}>
                  {link.texto}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionContainer>
  )
}
