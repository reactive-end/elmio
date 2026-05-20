'use client'

import type { ReactNode } from 'react'
import type { EstiloSeccion } from '@/src/utils/editor-types.d'

interface SectionContainerProps {
  estilo: EstiloSeccion
  children: ReactNode
  className?: string
  id?: string
}

/**
 * Contenedor visual de seccion que aplica estilos de padding, margen y fondo desde la config.
 */
export function SectionContainer({ estilo, children, className = '', id }: SectionContainerProps) {
  const bgStyle: React.CSSProperties = {}
  if (estilo.gradienteFondo) bgStyle.backgroundImage = estilo.gradienteFondo
  else if (estilo.colorFondo !== 'transparente') bgStyle.backgroundColor = estilo.colorFondo
  if (estilo.imagenFondo) bgStyle.backgroundImage = estilo.imagenFondo

  return (
    <section
      id={id}
      className={`w-full relative overflow-hidden ${className}`}
      style={{
        ...bgStyle,
        paddingTop: estilo.paddingSuperior,
        paddingRight: estilo.paddingDerecho,
        paddingBottom: estilo.paddingInferior,
        paddingLeft: estilo.paddingIzquierdo,
        marginTop: estilo.margenSuperior,
        marginBottom: estilo.margenInferior,
        borderWidth: estilo.anchoBorde,
        borderColor: estilo.colorBorde,
        borderRadius: estilo.radioBorde,
        borderStyle: estilo.estiloBorde || 'solid',
      }}
    >
      {/* Overlay de oscurecimiento para imágenes de fondo */}
      {estilo.imagenFondo && estilo.opacidadOverlay > 0 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none z-0"
          style={{ opacity: estilo.opacidadOverlay / 100 }}
        />
      )}

      {/* Patrones de fondo decorativos */}
      {estilo.patronFondo && estilo.patronFondo !== 'ninguno' && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {estilo.patronFondo === 'puntos' && (
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: 'radial-gradient(currentColor 1.5px, transparent 1.5px)',
                backgroundSize: '20px 20px',
                color: estilo.tituloColor || '#111827',
              }}
            />
          )}
          {estilo.patronFondo === 'cuadricula' && (
            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                color: estilo.tituloColor || '#111827',
              }}
            />
          )}
          {estilo.patronFondo === 'diagonal' && (
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%, currentColor), linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%, currentColor)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
                color: estilo.tituloColor || '#111827',
              }}
            />
          )}
          {estilo.patronFondo === 'malla' && (
            <div className="absolute inset-0 overflow-hidden opacity-[0.08]">
              <div
                className="absolute -top-[20%] -left-[10%] w-[50%] h-[60%] rounded-full filter blur-[80px]"
                style={{ backgroundColor: estilo.botonColorFondo || '#0f4ece' }}
              />
              <div
                className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[60%] rounded-full filter blur-[80px]"
                style={{ backgroundColor: estilo.tituloColor || '#9c27b0' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Contenedor del contenido */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </section>
  )
}
