'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Search,
  Mail,
  Calendar,
  Link2,
  Phone,
} from 'lucide-react'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/atoms/Alert/Alert'
import { ConfirmModal } from '@/components/molecules/ConfirmModal/ConfirmModal'
import { alliesService, type Allied } from '@/src/services/allies.service'

export default function AlliesAdminPage() {
  const router = useRouter()
  const [allies, setAllies] = useState<Allied[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Estado del modal de confirmación de eliminación
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedAllyToDelete, setSelectedAllyToDelete] = useState<Allied | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Búsqueda en tiempo real
  const [search, setSearch] = useState('')

  const fetchAllies = async () => {
    try {
      setLoading(true)
      const data = await alliesService.list()
      setAllies(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar aliados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchAllies()
  }, [])

  const handleOpenDelete = (ally: Allied) => {
    setSelectedAllyToDelete(ally)
    setConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedAllyToDelete) return
    try {
      setDeleting(true)
      await alliesService.remove(selectedAllyToDelete.id)
      setSuccess('¡Aliado eliminado con éxito!')
      setConfirmOpen(false)
      setSelectedAllyToDelete(null)
      await fetchAllies()
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar aliado.')
    } finally {
      setDeleting(false)
    }
  }

  const filteredAllies = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return allies
    return allies.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        (a.email && a.email.toLowerCase().includes(query)) ||
        (a.slug && a.slug.toLowerCase().includes(query)) ||
        a.phone.includes(query) ||
        a.id.toLowerCase().includes(query),
    )
  }, [allies, search])

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
          <h1 className="text-2xl font-bold tracking-tight text-body">Administración de Aliados</h1>
          <p className="mt-1 text-sm text-body-muted">
            Gestiona las cuentas de aliados que pueden crear y configurar marketplaces.
          </p>
        </div>
        <Button
          id="btn-new-allied"
          onClick={() => router.push('/dashboard/config/allies/new')}
          className="flex items-center gap-2 shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>Nuevo Aliado</span>
        </Button>
      </div>

      {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}
      {success && <Alert type="success" message={success} onDismiss={() => setSuccess(null)} />}

      {/* Barra de Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          id="input-search-allies"
          placeholder="Buscar aliado por nombre, correo, slug, teléfono..."
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
            <p className="text-sm text-body-muted animate-pulse">Cargando aliados...</p>
          </div>
        ) : filteredAllies.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
            <p className="text-sm font-medium">No se encontraron aliados.</p>
            {allies.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Crea un aliado para comenzar.</p>
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
                    Slug / URL Aliado
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
                {filteredAllies.map((ally) => (
                  <tr key={ally.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-body block">{ally.name}</span>
                        <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
                          {ally.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-xs text-secondary font-medium">
                        <Link2 className="w-3.5 h-3.5" />
                        <code className="bg-secondary/5 rounded px-1.5 py-0.5 font-mono text-xs">
                          {ally.slug || 'sin-slug'}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-muted">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        ({ally.countryCode}) {ally.phone}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-muted font-medium">
                      {ally.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {ally.email}
                        </span>
                      ) : (
                        <span className="text-gray-300 italic text-xs">No asignado</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {fmtDate(ally.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`btn-edit-allied-${ally.id}`}
                          type="button"
                          onClick={() => router.push(`/dashboard/config/allies/${ally.id}`)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors border border-transparent hover:border-secondary/20"
                          title="Editar Aliado"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button
                          id={`btn-delete-allied-${ally.id}`}
                          type="button"
                          onClick={() => handleOpenDelete(ally)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                          title="Eliminar Aliado"
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
        title="¿Eliminar esta cuenta de aliado?"
        description={
          selectedAllyToDelete
            ? `Esta acción eliminará de forma permanente al aliado "${selectedAllyToDelete.name}" (${selectedAllyToDelete.email || selectedAllyToDelete.phone}) y no se puede deshacer. Todos los recursos asociados serán reasignados.`
            : 'Esta acción eliminará de forma permanente la cuenta de este aliado y no se puede deshacer.'
        }
      />
    </div>
  )
}
