'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { X, LogOut } from 'lucide-react'
import { useSidebar } from './useSidebar'
import { Sidebar } from '@/components/organisms/Sidebar/Sidebar'
import { Topbar } from '@/components/organisms/Topbar/Topbar'
import { ChangePasswordModal } from '@/components/organisms/ChangePasswordModal/ChangePasswordModal'
import { authService } from '@/src/services/auth.service'
import { enterpriseService } from '@/src/services/empresa.service'
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
  const router = useRouter()
  const { collapsed, toggleCollapsed, openGroups, toggleGroup, isGroupOpen } = useSidebar()
  const [mobileOpen, setMobileOpen] = useState(false)

  const [mustCompleteOnboarding, setMustCompleteOnboarding] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [loadingGate, setLoadingGate] = useState(true)

  useEffect(() => {
    const session = authService.getSession()

    const forbiddenForCompany = [
      '/dashboard/gallery',
      '/dashboard/marketplaces',
      '/dashboard/products',
    ]

    const forbiddenForEmployee = [
      '/dashboard/gallery',
      '/dashboard/enterprise',
      '/dashboard/marketplaces',
      '/dashboard/products',
    ]

    const forbiddenForClient = [
      '/dashboard/gallery',
      '/dashboard/enterprise',
      '/dashboard/marketplaces',
      '/dashboard/products',
      '/dashboard/collaborator/account-statement',
      '/dashboard/collaborator/requests',
      '/dashboard/collaborator/shop',
      '/dashboard/config',
    ]

    const forbiddenForAllied = [
      '/dashboard/enterprise',
      '/dashboard/collaborator',
      '/dashboard/config',
    ]

    if (
      session?.role === 'COMPANY' &&
      forbiddenForCompany.some((path) => pathname.startsWith(path))
    ) {
      router.push('/dashboard/enterprise/shop')
      return
    }

    if (
      session?.role === 'EMPLOYEE' &&
      forbiddenForEmployee.some((path) => pathname.startsWith(path))
    ) {
      router.push('/dashboard/collaborator/account-statement')
      return
    }

    if (
      session?.role === 'CLIENT' &&
      (pathname === '/dashboard' || pathname === '/dashboard/' || forbiddenForClient.some((path) => pathname.startsWith(path)))
    ) {
      router.push('/dashboard/collaborator/purchases')
      return
    }

    if (
      session?.role === 'ALLIED' &&
      (pathname === '/dashboard' || pathname === '/dashboard/' || forbiddenForAllied.some((path) => pathname.startsWith(path)))
    ) {
      router.push('/dashboard/marketplaces')
      return
    }

    if (session?.requirePasswordChange) {
      setMustChangePassword(true)
      setLoadingGate(false)
      return
    }

    const checkPersonOnboarding = async () => {
      try {
        const bankAccounts = await enterpriseService.listMyBankAccounts()
        if (bankAccounts.length === 0) {
          setMustCompleteOnboarding(true)
          if (pathname !== '/dashboard/person/onboarding') {
            router.push('/dashboard/person/onboarding')
          }
        } else {
          setMustCompleteOnboarding(false)
        }
        setLoadingGate(false)
      } catch {
        setLoadingGate(false)
      }
    }

    if (session?.role === 'COMPANY') {
      enterpriseService
        .getMe()
        .then((emp) => {
          if (emp && !emp.onboardingCompleted) {
            setMustCompleteOnboarding(true)
            if (pathname !== '/dashboard/enterprise/onboarding') {
              router.push('/dashboard/enterprise/onboarding')
            }
          } else {
            setMustCompleteOnboarding(false)
          }
          setLoadingGate(false)
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : ''
          // Solo redirigir a onboarding si el error indica explícitamente que la empresa no existe
          const isNoEnterprise = message.toLowerCase().includes('no se encontr')
          
          if (isNoEnterprise) {
            setMustCompleteOnboarding(true)
            if (pathname !== '/dashboard/enterprise/onboarding') {
              router.push('/dashboard/enterprise/onboarding')
            }
          } else {
            // Si es otro error (error de conexión, de sesión, 500, etc.), NO asumimos onboarding incompleto
            setMustCompleteOnboarding(false)
          }
          setLoadingGate(false)
        })
    } else if (session?.role === 'CLIENT' || session?.role === 'EMPLOYEE') {
      checkPersonOnboarding()
    } else {
      setLoadingGate(false)
    }
  }, [pathname, router])

  const handlePasswordChanged = useCallback(() => {
    window.location.reload()
  }, [])

  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileOpen((v) => !v)
    } else {
      toggleCollapsed()
    }
  }

  const closeMobile = () => setMobileOpen(false)

  if (loadingGate) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
          <p className="text-sm text-body-muted font-medium">Verificando sesion...</p>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    authService.clearToken()
    window.location.href = '/login'
  }

  if (mustCompleteOnboarding && (pathname === '/dashboard/enterprise/onboarding' || pathname === '/dashboard/person/onboarding')) {
    return (
      <div className="relative flex h-dvh w-full overflow-hidden bg-gray-50">
        {/* Boton flotante premium de Cerrar Sesion */}
        <div className="absolute top-4 right-4 z-50">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-body hover:border-red-200 hover:bg-red-50/50 hover:text-red-600 transition-all duration-200 shadow-sm shadow-black/5 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesion</span>
          </button>
        </div>

        <main className="flex-1 overflow-y-auto w-full h-full p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-surface-muted">
          {children}
        </main>
        {mustChangePassword && <ChangePasswordModal onPasswordChanged={handlePasswordChanged} />}
      </div>
    )
  }

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
      {mustChangePassword && <ChangePasswordModal onPasswordChanged={handlePasswordChanged} />}
    </div>
  )
}
