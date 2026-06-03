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
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/atoms/Alert/Alert'
import { ConfirmModal } from '@/components/molecules/ConfirmModal/ConfirmModal'
import { rbacService, type RbacUser, type RbacPermissions } from '@/src/services/rbac.service'

const ROLES = ['ADMIN', 'FINANCE', 'COMPANY', 'EMPLOYEE', 'CLIENT', 'ALLIED'] as const

const SIDEBAR_GROUPS: Array<{ key: string; label: string }> = [
  { key: 'home', label: 'Inicio' },
  { key: 'enterprise', label: 'Empresa' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'products', label: 'Productos' },
  { key: 'employee', label: 'Colaborador' },
  { key: 'shop', label: 'Tienda' },
  { key: 'gallery', label: 'Galería' },
  { key: 'config', label: 'Configuración' },
  { key: 'finance-desk', label: 'Finanzas' },
  { key: 'client-purchases', label: 'Mis Compras' },
]

export default function RbacAdminPage() {
  const router = useRouter()
  const [activeRole, setActiveRole] = useState<string>('ADMIN')
  const [permissions, setPermissions] = useState<RbacPermissions>({})
  const [permLoading, setPermLoading] = useState(true)
  const [permSaving, setPermSaving] = useState(false)

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

  const handleTogglePermission = async (groupKey: string) => {
    const current = permissions[activeRole]?.[groupKey] ?? true
    const updated = !current

    const optimistic = { ...permissions }
    if (!optimistic[activeRole]) optimistic[activeRole] = {}
    optimistic[activeRole][groupKey] = updated
    setPermissions(optimistic)

    try {
      setPermSaving(true)
      await rbacService.savePermissions(activeRole, [{ groupKey, visible: updated }])
    } catch (err) {
      setPermissions(permissions)
      setAlert({ type: 'error', message: 'Error al guardar permiso.' })
    } finally {
      setPermSaving(false)
    }
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

  return (
    <div className="w-full space-y-6">
      {alert && (
        <Alert
          type={alert.type}
          title={alert.type === 'success' ? 'Éxito' : 'Error'}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">RBAC</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de permisos y usuarios por rol
          </p>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setActiveRole(role)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeRole === role
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <Shield className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">
            Permisos de Sidebar — {activeRole}
          </h2>
          {permSaving && (
            <span className="text-xs text-gray-400 ml-2">Guardando...</span>
          )}
        </div>

        {permLoading ? (
          <div className="text-sm text-gray-400">Cargando permisos...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {SIDEBAR_GROUPS.map((group) => {
              const checked = permissions[activeRole]?.[group.key] ?? true
              return (
                <label
                  key={group.key}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleTogglePermission(group.key)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{group.label}</span>
                </label>
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
              Usuarios — {activeRole}
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
            <Alert type="error" title="Error" onClose={() => setUserError(null)}>
              {userError}
            </Alert>
          </div>
        )}

        {userLoading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No hay usuarios con el rol {activeRole}.
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
        open={confirmOpen}
        title="Desactivar usuario"
        description={`¿Estás seguro de desactivar a ${userToDelete?.name}? El usuario no podrá iniciar sesión hasta que sea reactivado.`}
        confirmLabel="Desactivar"
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          setConfirmOpen(false)
          setUserToDelete(null)
        }}
        loading={deleting}
        variant="danger"
      />
    </div>
  )
}
