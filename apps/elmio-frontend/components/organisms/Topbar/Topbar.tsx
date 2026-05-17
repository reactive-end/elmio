'use client'

import { Settings, Bell, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import Link from 'next/link'
import type { TopbarProps } from './Topbar.d'

/**
 * Organismo de barra superior del dashboard.
 * Contiene el boton de toggle del sidebar, notificaciones, configuracion y avatar.
 */
export function Topbar({ onToggleSidebar, sidebarCollapsed }: TopbarProps) {
  return (
    <header
      className="relative h-16 flex items-center justify-between px-5 flex-shrink-0 border-b border-white/10 overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, oklch(0.5 0.27 264.01) 0%, oklch(0.38 0.24 240) 100%)',
      }}
    >
      {/* Dot pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="topbar-dots"
            x="0"
            y="0"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.5" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#topbar-dots)" />
      </svg>

      {/* Decorative circle */}
      <div className="absolute right-[-30px] top-[-30px] w-[100px] h-[100px] rounded-full bg-white/5 pointer-events-none" />

      {/* Left: toggle */}
      <div className="relative z-10 flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all duration-150"
          aria-label={sidebarCollapsed ? 'Expandir menu' : 'Colapsar menu'}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" strokeWidth={1.5} />
          ) : (
            <PanelLeftClose className="w-5 h-5" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Right: actions */}
      <div className="relative z-10 flex items-center gap-1">
        <button
          type="button"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all duration-150"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <Link
          href="/dashboard/settings"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all duration-150"
          aria-label="Configuracion"
        >
          <Settings className="w-5 h-5" strokeWidth={1.5} />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center ml-1 border border-white/20">
          <span className="text-white text-sm font-semibold">E</span>
        </div>
      </div>
    </header>
  )
}
