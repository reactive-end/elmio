'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import * as Icons from 'lucide-react'
import { SectionContainer } from './SectionContainer'
import type { SeccionMarketplace, MenuItem } from '@/src/utils/editor-types.d'
import { authService } from '@/src/services/auth.service'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconsMap = Icons as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>

/** Resuelve un nombre de ícono Lucide con capitalización flexible */
function resolveIcon(name: string): React.ComponentType<{ className?: string; strokeWidth?: number }> | undefined {
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1)
  return iconsMap[capitalized] ?? iconsMap[name]
}

interface HeaderSectionProps {
  seccion: SeccionMarketplace
}

/**
 * Renderiza la cabecera con logo, navegación con submenús expandibles como barra
 * de ancho completo, buscador con botón azul, y acciones de cuenta/carrito.
 */
export function HeaderSection({ seccion }: HeaderSectionProps) {
  const { contenido, estilo } = seccion
  const menu = (contenido.menu ?? []) as MenuItem[]
  const logo = contenido.logoUrl || '/logo.svg'

  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setUser(authService.getSession())

    const handleLoginUpdate = () => {
      setUser(authService.getSession())
    }

    window.addEventListener('marketplace-login-success-update', handleLoginUpdate)
    return () => {
      window.removeEventListener('marketplace-login-success-update', handleLoginUpdate)
    }
  }, [])

  /** Cancela el cierre programado */
  const cancelarCierre = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  /** Programa un cierre con retardo para que el usuario pueda mover el mouse al submenu */
  const programarCierre = useCallback(() => {
    cancelarCierre()
    closeTimeoutRef.current = setTimeout(() => {
      setMenuAbiertoId(null)
    }, 280)
  }, [cancelarCierre])

  /** Al entrar al menú principal, abre el submenú */
  const abrirMenu = useCallback(
    (id: string) => {
      cancelarCierre()
      setMenuAbiertoId(id)
    },
    [cancelarCierre],
  )

  /** Cerrar si se hace clic fuera */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuAbiertoId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Limpieza del timeout
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  const menuAbierto = menu.find((m) => m.id === menuAbiertoId)
  const tieneSubmenuAbierto = menuAbierto && menuAbierto.submenus && menuAbierto.submenus.length > 0

  return (
    <SectionContainer
      overflowVisible={true}
      className="z-50 relative"
      estilo={{
        ...estilo,
        paddingSuperior: 0,
        paddingInferior: 0,
        paddingDerecho: 0,
        paddingIzquierdo: 0,
      }}
    >
      <div ref={navRef} className="sticky top-0 z-50 bg-white">
        {/* ── Barra principal ── */}
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3">
            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center">
              <img src={logo} alt="Logo" className="h-8 w-auto" />
            </Link>

            {/* Navegación central */}
            <nav className="hidden items-center justify-center lg:flex gap-1">
              {menu.map((item) => {
                const hasSubmenus = item.submenus && item.submenus.length > 0
                const LucideIcon = resolveIcon(item.icono || 'Grid')
                const isActive = menuAbiertoId === item.id

                if (hasSubmenus) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`
                        inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold 
                        transition-colors cursor-pointer rounded-lg
                        ${isActive ? 'text-secondary bg-secondary/5' : 'text-gray-700 hover:text-secondary'}
                      `}
                      onMouseEnter={() => abrirMenu(item.id)}
                      onMouseLeave={programarCierre}
                      onClick={() => setMenuAbiertoId(isActive ? null : item.id)}
                    >
                      {LucideIcon && (
                        <LucideIcon
                          className={`h-4 w-4 transition-colors ${isActive ? 'text-secondary' : 'text-gray-400'}`}
                          strokeWidth={1.8}
                        />
                      )}
                      <span>{item.label}</span>
                      <svg
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${isActive ? 'rotate-180 text-secondary' : 'text-gray-400'}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:text-secondary cursor-pointer rounded-lg"
                  >
                    {LucideIcon && (
                      <LucideIcon
                        className="h-4 w-4 text-gray-400 transition-colors"
                        strokeWidth={1.8}
                      />
                    )}
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Acciones: Buscador + Cuenta + Carrito */}
            <div className="flex items-center gap-3">
              {/* Buscador con botón azul */}
              <div className="hidden items-center overflow-hidden rounded-full border border-gray-200 bg-gray-50/60 md:flex">
                <input
                  className="h-9 w-44 bg-transparent px-4 text-sm focus:outline-none lg:w-56 placeholder:text-gray-400"
                  placeholder="Buscar"
                />
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-white transition-colors hover:bg-secondary/90 mr-0.5 cursor-pointer"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </button>
              </div>

              <div
                className="flex items-center gap-4"
                style={{ color: estilo.tituloColor || '#111827' }}
              >
                {user ? (
                  <>
                    {/* Identificador de Usuario (Premium con indicador de sesión activa) */}
                    <div className="relative flex items-center justify-center h-9 w-9 rounded-full bg-secondary/5 border border-secondary/15 text-secondary shadow-sm" title={user.email}>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {/* Círculo verde indicador de sesión activa */}
                      <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                    </div>

                    {/* Botón puramente iconográfico de ir al Dashboard */}
                    <Link
                      href="/dashboard"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm cursor-pointer"
                      title="Ir al Dashboard"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="7" height="9" rx="1" />
                        <rect x="14" y="3" width="7" height="5" rx="1" />
                        <rect x="14" y="12" width="7" height="9" rx="1" />
                        <rect x="3" y="16" width="7" height="5" rx="1" />
                      </svg>
                    </Link>
                  </>
                ) : (
                  /* Botón de Cuenta (Personita) que siempre envía al Login */
                  <Link
                    href="/login"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm cursor-pointer"
                    title="Iniciar sesión"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </Link>
                )}

                {/* Botón de Carrito (Sin texto) */}
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm cursor-pointer"
                  title="Carrito"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* ── Panel de submenús expandible (barra de ancho completo) ── */}
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${tieneSubmenuAbierto ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}
          `}
          onMouseEnter={cancelarCierre}
          onMouseLeave={programarCierre}
        >
          {tieneSubmenuAbierto && (
            <div className="border-b border-gray-100 bg-white/95 backdrop-blur-sm shadow-sm">
              <div className="mx-auto max-w-7xl px-4 py-4">
                <div className="flex items-start gap-8 justify-center">
                  {menuAbierto.submenus.map((sub) => {
                    const SubIcon = resolveIcon(sub.icono || 'Sparkles')

                    return (
                      <Link
                        key={sub.id}
                        href={sub.href}
                        className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-gray-50 cursor-pointer min-w-[180px] max-w-[260px]"
                      >
                        {SubIcon && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary group-hover:bg-secondary/15 transition-colors">
                            <SubIcon className="h-4 w-4" strokeWidth={1.8} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-secondary transition-colors">
                            {sub.label}
                          </div>
                          {sub.descripcion && (
                            <p className="mt-0.5 text-xs text-gray-500 leading-relaxed line-clamp-2">
                              {sub.descripcion}
                            </p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SectionContainer>
  )
}
