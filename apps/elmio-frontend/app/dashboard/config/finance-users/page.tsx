'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Search,
  Mail,
  Calendar,
  Landmark,
  Phone,
} from 'lucide-react'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/atoms/Alert/Alert'
import { ConfirmModal } from '@/components/molecules/ConfirmModal/ConfirmModal'
import { financeUsersService, type FinanceUser } from '@/src/services/finance-users.service'

export default function FinanceUsersAdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<FinanceUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Estado del modal de confirmación de eliminación
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<FinanceUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Búsqueda en tiempo real
  const [search, setSearch] = useState('')

  // Mostrar mensaje de éxito si viene en los parámetros de la URL
  useEffect(() => {
    const successParam = searchParams.get('success')
    if (successParam === 'created') {
      setSuccess('¡Usuario de finanzas registrado con éxito!')
      // Limpiar URL
      router.replace('/dashboard/config/finance-users')
      setTimeout(() => setSuccess(null), 4000)
    } else if (successParam === 'updated') {
      setSuccess('¡Usuario de finanzas actualizado con éxito!')
      router.replace('/dashboard/config/finance-users')
      setTimeout(() => setSuccess(null), 4000)
    }
  }, [searchParams, router])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await financeUsersService.list()
      setUsers(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios de finanzas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchUsers()
  }, [])

  const handleOpenDelete = (user: FinanceUser) => {
    setSelectedUserToDelete(user)
    setConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedUserToDelete) return
    try {
      setDeleting(true)
      await financeUsersService.remove(selectedUserToDelete.id)
      setSuccess('¡Usuario de finanzas eliminado con éxito!')
      setConfirmOpen(false)
      setSelectedUserToDelete(null)
      await fetchUsers()
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar usuario de finanzas.')
    } finally {
      setDeleting(false)
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.slug && u.slug.toLowerCase().includes(query)) ||
        u.phone.includes(query) ||
        u.id.toLowerCase().includes(query),
    )
  }, [users, search])

  const fmtDate = (dStr: string) => {
    try {
      const date = new Date(dStr)
      return new Intl.DateTimeFormat('es-VE', {
        dateStyle: 'medium',
      }).format(date)
    } catch {
      return dStr
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-body">Administración de Usuarios de Finanzas</h1>
          <p className="mt-1 text-sm text-body-muted">
            Gestiona las cuentas de los analistas de finanzas que validan y aprueban los desembolsos.
          </p>
        </div>
        <Button
          id="btn-new-finance"
          onClick={() => router.push('/dashboard/config/finance-users/new')}
          className="flex items-center gap-2 shrink-0 bg-secondary hover:bg-secondary/95 border-none shadow-sm"
        >
          <UserPlus className="h-4 w-4 text-white" />
          <span className="text-white font-semibold">Nuevo Usuario</span>
        </Button>
      </div>

      {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}
      {success && <Alert type="success" message={success} onDismiss={() => setSuccess(null)} />}

      {/* Barra de Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          id="input-search-finance-users"
          placeholder="Buscar usuario por nombre, correo, cédula, teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabla Premium */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-secondary border-t-transparent animate-spin mx-auto mb-2" />
            <p className="text-sm text-body-muted animate-pulse">Cargando usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
            <p className="text-sm font-medium">No se encontraron usuarios de finanzas.</p>
            {users.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Crea un analista para comenzar.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-150 bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Nombre / ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Cédula
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Correo Electrónico
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Fecha Registro
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-body block">{user.name}</span>
                        <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
                          {user.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-xs text-secondary font-medium">
                        <Landmark className="w-3.5 h-3.5" />
                        <code className="bg-secondary/5 rounded px-1.5 py-0.5 font-mono text-xs">
                          {user.slug || 'sin-cedula'}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-muted">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {user.phone}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-muted font-medium">
                      {user.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {user.email}
                        </span>
                      ) : (
                        <span className="text-gray-300 italic text-xs">No asignado</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {fmtDate(user.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`btn-edit-finance-${user.id}`}
                          type="button"
                          onClick={() => router.push(`/dashboard/config/finance-users/${user.id}`)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors border border-transparent hover:border-secondary/20"
                          title="Editar Usuario"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button
                          id={`btn-delete-finance-${user.id}`}
                          type="button"
                          onClick={() => handleOpenDelete(user)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                          title="Eliminar Usuario"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmación de borrado */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleting}
        title="¿Eliminar esta cuenta de finanzas?"
        description={
          selectedUserToDelete
            ? `Esta acción eliminará de forma permanente al usuario "${selectedUserToDelete.name}" (${selectedUserToDelete.email}) y no se puede deshacer.`
            : 'Esta acción eliminará de forma permanente la cuenta de finanzas y no se puede deshacer.'
        }
      />
    </div>
  )
}
