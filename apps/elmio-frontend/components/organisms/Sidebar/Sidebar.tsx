'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { authService } from '@/src/services/auth.service'
import {
  ChevronDown,
  ChevronRight,
  Images,
  LayoutDashboard,
  List,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Building2,
  Landmark,
  Users,
  FileText,
  DollarSign,
  LogOut,
  MessageSquare,
} from 'lucide-react'
import { Logo } from '@/components/atoms/Logo/Logo'
import { useRouter } from 'next/navigation'
import type { SidebarProps } from './Sidebar.d'

interface NavChild {
  key: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
}

interface NavGroup {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  children: NavChild[]
}

function getVisibleChildren(group: NavGroup, role: string | null): NavChild[] {
  if (group.key !== 'shop') return group.children

  if (role === 'COMPANY') {
    return [
      {
        key: 'dashboard-shop-company',
        label: 'Ver productos',
        href: '/dashboard/enterprise/shop',
        icon: ShoppingBag,
      },
    ]
  }

  if (role === 'EMPLOYEE') {
    return [
      {
        key: 'dashboard-shop-employee',
        label: 'Ver productos',
        href: '/dashboard/collaborator/shop',
        icon: ShoppingBag,
      },
    ]
  }

  return group.children
}

const NAV: NavGroup[] = [
  {
    key: 'home',
    label: 'Inicio',
    icon: LayoutDashboard,
    children: [{ key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    key: 'enterprise',
    label: 'Empresa',
    icon: Building2,
    children: [
      {
        key: 'enterprise-onboarding',
        label: 'Configuracion',
        href: '/dashboard/enterprise/onboarding',
        icon: Landmark,
      },
      {
        key: 'enterprise-account',
        label: 'Estado de cuenta',
        href: '/dashboard/enterprise/account-statement',
        icon: DollarSign,
      },
      {
        key: 'enterprise-collaborators',
        label: 'Colaboradores',
        href: '/dashboard/enterprise/collaborators',
        icon: Users,
      },
      {
        key: 'enterprise-requests',
        label: 'Solicitudes',
        href: '/dashboard/enterprise/requests',
        icon: FileText,
      },
      {
        key: 'enterprise-contracts',
        label: 'Contratos',
        href: '/dashboard/enterprise/contracts',
        icon: FileText,
      },
    ],
  },
  {
    key: 'marketplace',
    label: 'Marketplace',
    icon: Store,
    children: [
      {
        key: 'marketplaces',
        label: 'Ver marketplaces',
        href: '/dashboard/marketplaces',
        icon: Store,
      },
    ],
  },
  {
    key: 'products',
    label: 'Productos',
    icon: Package,
    children: [
      { key: 'products-list', label: 'Ver productos', href: '/dashboard/products', icon: List },
      {
        key: 'products-new',
        label: 'Nuevo producto',
        href: '/dashboard/products/new',
        icon: ShoppingBag,
      },
    ],
  },
  {
    key: 'employee',
    label: 'Colaborador',
    icon: Users,
    children: [
      {
        key: 'employee-account',
        label: 'Estado de cuenta',
        href: '/dashboard/collaborator/account-statement',
        icon: DollarSign,
      },
      {
        key: 'employee-requests',
        label: 'Solicitudes',
        href: '/dashboard/collaborator/requests',
        icon: FileText,
      },
    ],
  },
  {
    key: 'shop',
    label: 'Marketplace',
    icon: ShoppingBag,
    children: [
      {
        key: 'dashboard-shop',
        label: 'Ver productos',
        href: '/dashboard/collaborator/shop',
        icon: ShoppingBag,
      },
    ],
  },
  {
    key: 'gallery',
    label: 'Galeria',
    icon: Images,
    children: [
      { key: 'gallery-library', label: 'Biblioteca', href: '/dashboard/gallery', icon: Images },
    ],
  },
  {
    key: 'config',
    label: 'Configuracion',
    icon: Settings,
    children: [
      {
        key: 'config-whatsapp',
        label: 'WhatsApp Web',
        href: '/dashboard/config/whatsapp',
        icon: MessageSquare,
      },
    ],
  },
]

/**
 * Organismo de barra lateral con logo, navegacion colapsable y grupos expandibles.
 * Soporta modo colapsado (solo iconos) y modo expandido (icono + texto).
 */
export function Sidebar({ collapsed, onToggleGroup, isGroupOpen, currentPath }: SidebarProps) {
  const [role, setRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const session = authService.getSession()
    if (session) {
      setRole(session.role)
    }
  }, [])

  const handleLogout = () => {
    authService.clearToken()
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return currentPath === '/dashboard'
    return currentPath.startsWith(href)
  }

  const isChildActive = (group: NavGroup) => group.children.some((child) => isActive(child.href))

  const shouldGroupBeOpen = (key: string) =>
    isGroupOpen(key) || isChildActive(NAV.find((g) => g.key === key)!)

  return (
    <div
      className={`relative flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[68px]' : 'w-[240px]'
      }`}
      style={{
        background: 'linear-gradient(180deg, oklch(0.5 0.27 264.01) 0%, oklch(0.35 0.22 220) 100%)',
      }}
    >
      {/* Dot pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="sidebar-dots"
            x="0"
            y="0"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.5" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sidebar-dots)" />
      </svg>

      {/* Decorative circle */}
      <div className="absolute bottom-[-30px] left-[-30px] w-[120px] h-[120px] rounded-full bg-white/5 pointer-events-none" />

      {/* Logo area */}
      <div
        className={`relative z-10 flex items-center justify-center border-b border-white/10 h-20 ${collapsed ? 'px-3' : 'px-6'}`}
      >
        {!collapsed && <Logo width={120} height={36} className="brightness-0 invert" />}
        {collapsed && (
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-white text-sm font-bold">E</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 overflow-y-auto py-4 px-2">
        {NAV.filter((group) => {
          // Ocultar sección de Empresa en el menú lateral para administradores (ADMIN)
          if (group.key === 'enterprise' && role === 'ADMIN') {
            return false
          }

          if (group.key === 'enterprise' && role === 'EMPLOYEE') {
            return false
          }

          // Ocultar Marketplace y Productos de gestion para colaboradores y empresas.
          if (
            (group.key === 'marketplace' || group.key === 'products') &&
            (role === 'EMPLOYEE' || role === 'COMPANY')
          ) {
            return false
          }

          // Ocultar Galeria para colaboradores y empresas.
          if (group.key === 'gallery' && (role === 'EMPLOYEE' || role === 'COMPANY')) {
            return false
          }

          // La tienda general aplica a empresas y colaboradores.
          if (group.key === 'shop' && role !== 'COMPANY' && role !== 'EMPLOYEE') {
            return false
          }

          if (group.key === 'employee' && role !== 'EMPLOYEE') {
            return false
          }

          // Ocultar Configuracion para roles que no sean ADMIN
          if (group.key === 'config' && role !== 'ADMIN') {
            return false
          }

          return true
        }).map((group) => {
          const visibleChildren = getVisibleChildren(group, role)
          if (visibleChildren.length === 0) return null

          const open = shouldGroupBeOpen(group.key)

          return (
            <div key={group.key} className="mb-0.5">
              <button
                type="button"
                onClick={() => !collapsed && onToggleGroup(group.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-white/60 hover:bg-white/10 hover:text-white ${
                  collapsed ? 'justify-center' : ''
                }`}
                title={collapsed ? group.label : undefined}
              >
                <group.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{group.label}</span>
                    {open ? (
                      <ChevronDown className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                    )}
                  </>
                )}
              </button>

              {!collapsed && open && (
                <div className="ml-4 mt-0.5 border-l border-white/15 pl-3 flex flex-col gap-0.5">
                  {visibleChildren.map((child) => (
                    <Link
                      key={child.key}
                      href={child.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                        isActive(child.href)
                          ? 'bg-white/15 text-white font-medium'
                          : 'text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <child.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                      <span>{child.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Botón de Cerrar Sesión Premium */}
        <div className="mt-1">
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-white/60 hover:bg-white/10 hover:text-white ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
            {!collapsed && <span className="flex-1 text-left">Cerrar sesión</span>}
          </button>
        </div>
      </nav>
    </div>
  )
}
