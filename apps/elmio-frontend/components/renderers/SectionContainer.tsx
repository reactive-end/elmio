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
      className={`w-full ${className}`}
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
      }}
    >
      {children}
    </section>
  )
}
