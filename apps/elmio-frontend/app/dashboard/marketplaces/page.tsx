'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Plus, Pencil, ExternalLink, Search, ShieldAlert, Trash2, X, Download, Upload } from 'lucide-react'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { ConfirmModal } from '@/components/molecules/ConfirmModal/ConfirmModal'
import { useMarketplaces } from '@/src/hooks/pages/useMarketplaces'
import { authService } from '@/src/services/auth.service'
import { useRouter } from 'next/navigation'

/**
 * Página de listado y gestión multiversión de marketplaces.
 * Permite a aliados y administradores gestionar múltiples configuraciones,
 * activar versiones para rotación rápida y proteger configuraciones con seguridad visual premium.
 * Consume la lógica de negocio desacoplada del hook useMarketplaces.
 */
export default function MarketplacesPage() {
  const router = useRouter()
  const {
    search,
    setSearch,
    cargando,
    modalAbierto,
    setModalAbierto,
    nuevoNombre,
    setNuevoNombre,
    nuevoSlug,
    setNuevoSlug,
    nuevaDesc,
    setNuevaDesc,
    errorModal,
    guardando,
    activarMarketplace,
    eliminarMarketplace,
    handleCrear,
    filtered,
    esAdmin,
    importarMarketplace,
    exportarMarketplace,
  } = useMarketplaces()

  // Estados locales para el modal de confirmación SweetAlert
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null)
  const [borrando, setBorrando] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const openDeleteConfirm = (id: string) => {
    setSelectedIdToDelete(id)
    setDeleteError(null)
    setIsConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedIdToDelete) return
    try {
      setBorrando(true)
      setDeleteError(null)
      await eliminarMarketplace(selectedIdToDelete)
      setIsConfirmOpen(false)
      setSelectedIdToDelete(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar el marketplace.')
    } finally {
      setBorrando(false)
    }
  }

  useEffect(() => {
    const session = authService.getSession()
    if (session?.role === 'COMPANY') {
      router.replace('/dashboard/enterprise/shop')
    }
  }, [router])

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-body mb-1">Configuración de Marketplaces</h1>
          <p className="text-sm text-gray-500">
            {esAdmin
              ? 'Administra las configuraciones principales y de todos los aliados'
              : 'Administra tus múltiples configuraciones y rota la versión activa'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* File Input invisible para importar */}
          <input
            type="file"
            id="import-file-input"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = async (evt) => {
                try {
                  const content = evt.target?.result as string
                  const json = JSON.parse(content)
                  await importarMarketplace(json)
                  alert('¡Marketplace importado con éxito!')
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Error al procesar el archivo JSON.')
                }
              }
              reader.readAsText(file)
              e.target.value = '' // Reset
            }}
            className="hidden"
          />
          <Button
            variant="ghost"
            onClick={() => document.getElementById('import-file-input')?.click()}
            className="border border-gray-200"
          >
            <Upload className="w-4 h-4" strokeWidth={1.5} />
            Importar
          </Button>
          <Button onClick={() => setModalAbierto(true)}>
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Nueva versión
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          strokeWidth={1.5}
        />
        <Input
          placeholder="Buscar por nombre, slug o propietario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm animate-pulse">Cargando configuraciones...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">
                    Versión / Nombre
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">
                    Enlace / Slug
                  </th>
                  {esAdmin && (
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">
                      Aliado Propietario
                    </th>
                  )}
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">
                    Estado de Versión
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const publicUrl = m.propietario ? `/marketplace/${m.slug}` : `/${m.slug}`
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-body">{m.nombre}</span>
                          {m.descripcion && (
                            <span className="text-xs text-gray-400 line-clamp-1">
                              {m.descripcion}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-secondary/5 rounded-md px-2 py-1 text-secondary font-medium">
                          {publicUrl}
                        </code>
                      </td>
                      {esAdmin && (
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 font-mono text-xs">
                            {m.propietario || 'Empresa Principal (Default)'}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5 ${
                              m.activo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${m.activo ? 'bg-green-500' : 'bg-gray-400'}`}
                            />
                            {m.activo ? 'Activo' : 'Inactivo'}
                          </span>
                          {!m.activo && (
                            <button
                              onClick={() => void activarMarketplace(m.id)}
                              className="text-xs text-secondary hover:underline font-medium focus:outline-none transition-colors"
                            >
                              Activar
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {esAdmin && m.propietario && (
                            <div
                              className="flex items-center gap-1 text-amber-500 mr-2"
                              title="Advertencia: Editando como Admin"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </div>
                          )}
                          <Link
                            href={`/dashboard/marketplaces/${m.id}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors border border-transparent hover:border-secondary/20"
                            title="Diseñar / Editar en el Editor"
                          >
                            <Pencil className="w-4 h-4" strokeWidth={1.5} />
                          </Link>
                          <button
                            onClick={() => void exportarMarketplace(m.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors border border-transparent hover:border-secondary/20"
                            title="Exportar Configuración (JSON)"
                          >
                            <Download className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                          <Link
                            href={publicUrl}
                            target="_blank"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors border border-transparent hover:border-secondary/20"
                            title="Visualizar Página Pública"
                          >
                            <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                          </Link>
                          {!m.activo && (
                            <button
                              onClick={() => openDeleteConfirm(m.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                              title="Eliminar esta versión"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!cargando && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No se encontraron marketplaces ni configuraciones creadas.</p>
          </div>
        )}
      </div>

      {/* Modal de Creación Premium */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-100 overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-body">Crear Nueva Configuración</h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={(e) => void handleCrear(e)} className="p-6 flex flex-col gap-4">
              {errorModal && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
                  <p className="text-xs text-red-700 font-medium">{errorModal}</p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nombre de la Versión
                </label>
                <Input
                  placeholder="Ej: Versión Navideña, Principal..."
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  required
                />
              </div>



              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Descripción Corta (Interna)
                </label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-body transition-all duration-200 outline-none focus:border-border-focus focus:ring-2 focus:ring-ring/20 resize-none h-20"
                  placeholder="Describe brevemente el uso de esta versión..."
                  value={nuevaDesc}
                  onChange={(e) => setNuevaDesc(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalAbierto(false)}
                  disabled={guardando}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Crear Versión'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Borrado estilo SweetAlert */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={borrando}
        title="¿Eliminar esta versión?"
        description={
          deleteError 
            ? deleteError 
            : "Esta acción no se puede deshacer. Se eliminará la configuración de este marketplace de forma permanente."
        }
      />
    </div>
  )
}
