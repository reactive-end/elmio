'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Search,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Toggle } from '@/components/atoms/Toggle/Toggle'
import { ConfirmModal } from '@/components/molecules/ConfirmModal/ConfirmModal'
import { rbacService, type RbacUser, type RbacPermissions } from '@/src/services/rbac.service'

const ROLES: Array<{ key: string; label: string }> = [
  { key: 'ADMIN', label: 'Administrador' },
  { key: 'FINANCE', label: 'Finanzas' },
  { key: 'COMPANY', label: 'Empresa' },
  { key: 'EMPLOYEE', label: 'Colaborador' },
  { key: 'CLIENT', label: 'Cliente' },
  { key: 'ALLIED', label: 'Aliado' },
]

interface SidebarChild {
  key: string
  label: string
}

interface SidebarGroup {
  key: string
  label: string
  children: SidebarChild[]
}

/**
 * Visibilidad por defecto de cada sub-menú por rol, según las reglas
 * hardcodeadas del Sidebar. Solo los items listados son visibles por
 * defecto; el resto están ocultos.
 */
const DEFAULT_VISIBILITY: Record<string, Set<string>> = {
  ADMIN: new Set([
    'dashboard',
    'marketplaces',
    'products-list', 'products-new',
    'gallery-library',
    'config-whatsapp', 'config-enterprise-interest-rates', 'config-allies', 'config-rbac',
    'finance-requests', 'finance-purchases', 'config-bank-accounts', 'config-finance-users', 'config-currencies',
  ]),
  FINANCE: new Set([
    'dashboard',
    'finance-requests', 'finance-purchases', 'config-bank-accounts', 'config-currencies',
  ]),
  COMPANY: new Set([
    'dashboard',
    'enterprise-onboarding', 'enterprise-account', 'enterprise-collaborators', 'enterprise-requests', 'enterprise-contracts',
    'dashboard-shop-company', 'shop-purchases-company',
  ]),
  EMPLOYEE: new Set([
    'dashboard',
    'employee-account', 'employee-requests', 'employee-bank',
    'dashboard-shop-employee', 'shop-purchases-employee',
  ]),
  CLIENT: new Set([
    'dashboard',
    'client-purchases-list', 'client-bank',
  ]),
  ALLIED: new Set([
    'dashboard',
    'marketplaces',
    'products-list', 'products-new',
    'gallery-library',
  ]),
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    key: 'home',
    label: 'Inicio',
    children: [{ key: 'dashboard', label: 'Dashboard' }],
  },
  {
    key: 'enterprise',
    label: 'Empresa',
    children: [
      { key: 'enterprise-onboarding', label: 'Configuración' },
      { key: 'enterprise-account', label: 'Estado de cuenta' },
      { key: 'enterprise-collaborators', label: 'Colaboradores' },
      { key: 'enterprise-requests', label: 'Solicitudes' },
      { key: 'enterprise-contracts', label: 'Contratos' },
    ],
  },
  {
    key: 'marketplace',
    label: 'Marketplace',
    children: [{ key: 'marketplaces', label: 'Ver marketplaces' }],
  },
  {
    key: 'products',
    label: 'Productos',
    children: [
      { key: 'products-list', label: 'Ver productos' },
      { key: 'products-new', label: 'Nuevo producto' },
    ],
  },
  {
    key: 'employee',
    label: 'Colaborador',
    children: [
      { key: 'employee-account', label: 'Estado de cuenta' },
      { key: 'employee-requests', label: 'Solicitudes' },
      { key: 'employee-bank', label: 'Mis datos bancarios' },
    ],
  },
  {
    key: 'shop',
    label: 'Tienda',
    children: [
      { key: 'dashboard-shop', label: 'Ver productos (shop)' },
      { key: 'dashboard-shop-company', label: 'Tienda — Empresa' },
      { key: 'shop-purchases-company', label: 'Compras — Empresa' },
      { key: 'dashboard-shop-employee', label: 'Tienda — Colaborador' },
      { key: 'shop-purchases-employee', label: 'Compras — Colaborador' },
    ],
  },
  {
    key: 'gallery',
    label: 'Galería',
    children: [{ key: 'gallery-library', label: 'Biblioteca' }],
  },
  {
    key: 'config',
    label: 'Configuración',
    children: [
      { key: 'config-whatsapp', label: 'WhatsApp Web' },
      { key: 'config-enterprise-interest-rates', label: 'Tasas por empresa' },
      { key: 'config-allies', label: 'Aliados' },
      { key: 'config-rbac', label: 'Permisología' },
    ],
  },
  {
    key: 'finance-desk',
    label: 'Finanzas',
    children: [
      { key: 'finance-requests', label: 'Aprobar Solicitudes' },
      { key: 'finance-purchases', label: 'Control de Compras' },
      { key: 'config-bank-accounts', label: 'Cuentas bancarias' },
      { key: 'config-finance-users', label: 'Usuarios Finanzas' },
      { key: 'config-currencies', label: 'Monedas' },
    ],
  },
  {
    key: 'client-purchases',
    label: 'Compras',
    children: [
      { key: 'client-purchases-list', label: 'Compras' },
      { key: 'client-bank', label: 'Mis datos bancarios' },
    ],
  },
]

export default function RbacAdminPage() {
  const router = useRouter()
  const [activeRole, setActiveRole] = useState<string>('ADMIN')
  const [permissions, setPermissions] = useState<RbacPermissions>({})
  const [permLoading, setPermLoading] = useState(true)
  const [permSaving, setPermSaving] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const [users, setUsers] = useState<RbacUser[]>([])
  const [userLoading, setUserLoading] = useState(true)
  const [userError, setUserError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showInactive, setShowInactive] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<RbacUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const perPage = 15

  const fetchPermissions = useCallback(async () => {
    try {
      setPermLoading(true)
      const data = await rbacService.getPermissions()
      setPermissions(data)
    } catch {
      // Silencioso
    } finally {
      setPermLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      setUserLoading(true)
      setUserError(null)
      const data = await rbacService.listUsers({
        role: activeRole,
        page,
        perPage,
        search: search || undefined,
        includeInactive: showInactive,
      })
      setUsers(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      setUserError(err instanceof Error ? err.message : 'Error al cargar usuarios.')
    } finally {
      setUserLoading(false)
    }
  }, [activeRole, page, search, showInactive, perPage])

  useEffect(() => {
    void fetchPermissions()
  }, [fetchPermissions])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    setPage(1)
  }, [activeRole, search, showInactive])

  const isChildVisible = (childKey: string) => {
    if (permissions[activeRole]?.[childKey] !== undefined) {
      return permissions[activeRole][childKey]
    }
    return DEFAULT_VISIBILITY[activeRole]?.has(childKey) ?? false
  }

  const handleToggleChild = async (childKey: string) => {
    const current = isChildVisible(childKey)
    const updated = !current

    setPermissions((prev) => {
      const next = { ...prev }
      if (!next[activeRole]) next[activeRole] = {}
      next[activeRole][childKey] = updated
      return next
    })

    try {
      setPermSaving(true)
      await rbacService.savePermissions(activeRole, [{ groupKey: childKey, visible: updated }])
    } catch {
      setPermissions(permissions)
      setAlert({ type: 'error', message: 'Error al guardar permiso.' })
    } finally {
      setPermSaving(false)
    }
  }

  const handleToggleGroup = async (group: SidebarGroup) => {
    const allVisible = group.children.every((c) => isChildVisible(c.key))
    const newVisible = !allVisible

    const updates = group.children.map((c) => ({ groupKey: c.key, visible: newVisible }))

    setPermissions((prev) => {
      const next = { ...prev }
      if (!next[activeRole]) next[activeRole] = {}
      for (const c of group.children) {
        next[activeRole][c.key] = newVisible
      }
      return next
    })

    try {
      setPermSaving(true)
      await rbacService.savePermissions(activeRole, updates)
    } catch {
      setPermissions(permissions)
      setAlert({ type: 'error', message: 'Error al guardar permisos.' })
    } finally {
      setPermSaving(false)
    }
  }

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupKey)) {
        next.delete(groupKey)
      } else {
        next.add(groupKey)
      }
      return next
    })
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    try {
      setDeleting(true)
      await rbacService.deleteUser(userToDelete.id)
      setAlert({ type: 'success', message: 'Usuario desactivado correctamente.' })
      setConfirmOpen(false)
      setUserToDelete(null)
      void fetchUsers()
    } catch (err) {
      setAlert({ type: 'error', message: err instanceof Error ? err.message : 'Error al eliminar usuario.' })
    } finally {
      setDeleting(false)
    }
  }

  const roleLabel = ROLES.find((r) => r.key === activeRole)?.label ?? activeRole

  return (
    <div className="w-full space-y-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onDismiss={() => setAlert(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Permisología</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configura qué secciones de la barra lateral ve cada rol
          </p>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {ROLES.map((role) => (
          <button
            key={role.key}
            type="button"
            onClick={() => setActiveRole(role.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeRole === role.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <Shield className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">
            Sidebar — {roleLabel}
          </h2>
          {permSaving && (
            <span className="text-xs text-gray-400 ml-2">Guardando...</span>
          )}
        </div>

        {permLoading ? (
          <div className="text-sm text-gray-400">Cargando permisos...</div>
        ) : (
          <div className="flex flex-col gap-2">
            {SIDEBAR_GROUPS.map((group) => {
              const childrenVisible = group.children.filter((c) => isChildVisible(c.key))
              const allVisible = group.children.every((c) => isChildVisible(c.key))
              const noneVisible = group.children.every((c) => !isChildVisible(c.key))
              const isCollapsed = collapsedGroups.has(group.key)

              return (
                <div
                  key={group.key}
                  className="border border-gray-100 rounded-xl overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50">
                    <button
                      type="button"
                      onClick={() => toggleGroupCollapse(group.key)}
                      className="flex items-center gap-2 text-left"
                    >
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          isCollapsed ? '-rotate-90' : ''
                        }`}
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        {group.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({childrenVisible.length}/{group.children.length})
                      </span>
                    </button>
                    <Toggle
                      checked={allVisible}
                      onChange={() => handleToggleGroup(group)}
                    />
                  </div>

                  {/* Children */}
                  {!isCollapsed && (
                    <div className="divide-y divide-gray-50">
                      {group.children.map((child) => (
                        <div
                          key={child.key}
                          className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50/30 transition-colors"
                        >
                          <span className="text-sm text-gray-600 ml-6">
                            {child.label}
                          </span>
                          <Toggle
                            checked={isChildVisible(child.key)}
                            onChange={() => handleToggleChild(child.key)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Users */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">
              Usuarios — {roleLabel}
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({total} total)
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300"
              />
              Inactivos
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 !py-2 text-sm w-56"
              />
            </div>
            <Button
              onClick={() => router.push('/dashboard/config/rbac/new')}
              className="flex items-center gap-1.5 !py-2.5"
            >
              <UserPlus className="w-4 h-4" strokeWidth={1.5} />
              Crear Usuario
            </Button>
          </div>
        </div>

        {userError && (
          <div className="px-6 py-3">
            <Alert type="error" message={userError} onDismiss={() => setUserError(null)} />
          </div>
        )}

        {userLoading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No hay usuarios con el rol {roleLabel}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/20">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Nombre
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Email
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Teléfono
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Estado
                  </th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                          user.isActive
                            ? 'bg-green-50 text-green-600 border border-green-100'
                            : 'bg-gray-50 text-gray-400 border border-gray-100'
                        }`}
                      >
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/config/rbac/${user.id}`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {user.isActive && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserToDelete(user)
                              setConfirmOpen(true)
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Desactivar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, page - 2)
                const num = start + i
                if (num > totalPages) return null
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPage(num)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      page === num
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {num}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Desactivar usuario"
        description={`¿Estás seguro de desactivar a ${userToDelete?.name}? El usuario no podrá iniciar sesión hasta que sea reactivado.`}
        confirmText="Desactivar"
        onConfirm={() => void handleDelete()}
        onClose={() => {
          setConfirmOpen(false)
          setUserToDelete(null)
        }}
        isLoading={deleting}
      />
    </div>
  )
}
