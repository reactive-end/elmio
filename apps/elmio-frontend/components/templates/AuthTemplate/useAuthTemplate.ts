'use client'

import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export interface UseAuthTemplateReturn {
  containerRef: React.RefObject<HTMLDivElement | null>
  leftPanelRef: React.RefObject<HTMLDivElement | null>
  rightPanelRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Hook que maneja las animaciones de entrada del template de autenticacion.
 * El panel izquierdo se desliza desde la izquierda, el derecho hace fade+escala.
 */
export function useAuthTemplate(): UseAuthTemplateReturn {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline()
      tl.from(leftPanelRef.current, {
        x: -60,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
      }).from(
        rightPanelRef.current,
        {
          opacity: 0,
          scale: 0.97,
          duration: 0.6,
          ease: 'power2.out',
        },
        '-=0.4',
      )
    },
    { scope: containerRef },
  )

  return {
    containerRef,
    leftPanelRef,
    rightPanelRef,
  }
}
