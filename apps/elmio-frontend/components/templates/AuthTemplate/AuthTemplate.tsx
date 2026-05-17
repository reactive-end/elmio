'use client'

import { Logo } from '@/components/atoms/Logo/Logo'
import { useAuthTemplate } from './useAuthTemplate'
import type { AuthTemplateProps } from './AuthTemplate.d'

/**
 * Template de autenticacion con panel decorativo izquierdo y contenido derecho.
 * El panel izquierdo muestra el logo centrado sobre un fondo con gradiente.
 * Animado con GSAP al montar.
 */
export function AuthTemplate({ children }: AuthTemplateProps) {
  const { containerRef, leftPanelRef, rightPanelRef } = useAuthTemplate()

  return (
    <div ref={containerRef} className="min-h-screen flex">
      {/* Left decorative panel */}
      <div
        ref={leftPanelRef}
        className="hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col items-center justify-center p-12"
        style={{
          background:
            'linear-gradient(135deg, oklch(0.5 0.27 264.01) 0%, oklch(0.35 0.22 220) 100%)',
        }}
      >
        {/* Dot pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[240px] h-[240px] rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-[-40px] w-[160px] h-[160px] rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10">
          <Logo width={240} height={72} className="brightness-0 invert" />
        </div>
      </div>

      {/* Right content panel */}
      <div
        ref={rightPanelRef}
        className="flex-1 flex flex-col items-center p-6 sm:p-10 bg-white overflow-y-auto max-h-screen"
      >
        <div className="w-full max-w-[520px] my-auto flex flex-col">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 self-center">
            <Logo width={140} height={42} />
          </div>

          {children}

          <p className="mt-8 text-xs text-gray-400 text-center">
            &copy; {new Date().getFullYear()} ElMio. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
