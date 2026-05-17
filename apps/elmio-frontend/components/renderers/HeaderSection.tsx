'use client'

import Link from 'next/link'
import { SectionContainer } from './SectionContainer'
import type { SeccionMarketplace, MenuItem } from '@/src/utils/editor-types.d'

interface HeaderSectionProps {
  seccion: SeccionMarketplace
}

/**
 * Renderiza la cabecera con logo, navegacion buscador y acciones de carrito/identificacion.
 */
export function HeaderSection({ seccion }: HeaderSectionProps) {
  const { contenido, estilo } = seccion
  const menu = (contenido.menu ?? []) as MenuItem[]
  const logo = contenido.logoUrl || '/logo.svg'

  return (
    <SectionContainer
      estilo={{
        ...estilo,
        paddingSuperior: 0,
        paddingInferior: 0,
        paddingDerecho: 0,
        paddingIzquierdo: 0,
      }}
    >
      <div className="sticky top-0 z-50 border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3">
            <Link href="/" className="flex shrink-0 items-center">
              <img src={logo} alt="Logo" className="h-8 w-auto" />
            </Link>

            <nav className="hidden items-center justify-center lg:flex">
              {menu.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:text-secondary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden items-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 md:flex">
                <input
                  className="h-10 w-48 bg-transparent px-3 text-sm focus:outline-none lg:w-64"
                  placeholder="Buscar"
                />
                <button type="button" className="h-10 px-3 text-gray-500">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </button>
              </div>
              <div
                className="flex items-center gap-3"
                style={{ color: estilo.tituloColor || '#111827' }}
              >
                <button type="button" className="flex flex-col items-center gap-1">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="hidden text-[10px] font-medium md:inline">Cuenta</span>
                </button>
                <button type="button" className="relative flex flex-col items-center gap-1">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>
                  <span className="hidden text-[10px] font-medium md:inline">Carrito</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}
