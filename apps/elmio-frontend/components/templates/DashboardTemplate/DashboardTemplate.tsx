'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useSidebar } from './useSidebar'
import { Sidebar } from '@/components/organisms/Sidebar/Sidebar'
import { Topbar } from '@/components/organisms/Topbar/Topbar'
import type { DashboardTemplateProps } from './DashboardTemplate.d'

/**
 * Template del dashboard con sidebar colapsable, topbar y area de contenido.
 *
 * - Desktop: sidebar fijo a la izquierda (colapsable a 68px).
 * - Mobile: sidebar en overlay con backdrop al hacer clic en el toggle.
 * - El sidebar y topbar comparten el gradiente azul corporativo.
 */
export function DashboardTemplate({ children }: DashboardTemplateProps) {
  const pathname = usePathname()
  const { collapsed, toggleCollapsed, openGroups, toggleGroup, isGroupOpen } = useSidebar()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileOpen((v) => !v)
    } else {
      toggleCollapsed()
    }
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="flex h-dvh overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          openGroups={openGroups}
          onToggleGroup={toggleGroup}
          isGroupOpen={isGroupOpen}
          currentPath={pathname}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={closeMobile} />
          <div className="relative z-50 h-full w-[280px]">
            <button
              type="button"
              onClick={closeMobile}
              className="absolute top-4 right-[-44px] w-9 h-9 flex items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all duration-150"
              aria-label="Cerrar menu"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <Sidebar
              collapsed={false}
              onToggle={closeMobile}
              openGroups={openGroups}
              onToggleGroup={toggleGroup}
              isGroupOpen={isGroupOpen}
              currentPath={pathname}
            />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onToggleSidebar={handleToggle} sidebarCollapsed={collapsed} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">{children}</main>
      </div>
    </div>
  )
}
