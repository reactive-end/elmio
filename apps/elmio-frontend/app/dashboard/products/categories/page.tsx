'use client'

import Link from 'next/link'
import { Plus, Pencil, Trash2, Search, ArrowLeft, Loader2, Check, AlertCircle } from 'lucide-react'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { useCategories } from '@/src/hooks/pages/useCategories'

/**
 * Pagina de gestion de categorias de productos.
 * Permite crear, listar, editar y eliminar categorias con una UX sumamente limpia y premium.
 * Consume la logica de negocio desacoplada del hook useCategories.
 */
export default function CategoriasPage() {
  const {
    search,
    setSearch,
    cargando,
    errorMsg,
    successMsg,
    isModalOpen,
    setIsModalOpen,
    editingCategory,
    formName,
    setFormName,
    formDescription,
    setFormDescription,
    formActive,
    setFormActive,
    isSubmitting,
    openCrearModal,
    openEditarModal,
    handleEliminar,
    handleSubmit,
    filtered,
  } = useCategories()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Boton volver y Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-body transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Productos
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Categorías de Productos</h1>
            <p className="text-sm text-gray-500">Agrupa y organiza tus productos en el marketplace</p>
          </div>
          <Button onClick={openCrearModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Categoría
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-6 text-sm animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && !isModalOpen && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl mb-6 text-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Barra de Búsqueda */}
      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          strokeWidth={1.5}
        />
        <Input
          placeholder="Buscar por nombre o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabla de Categorías */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-secondary mb-3" />
            <p className="text-sm">Cargando categorías...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                    Nombre
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                    Slug
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                    Descripción
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                    Estado
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 rounded-md px-2 py-1 text-gray-600 font-mono">
                        {c.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 line-clamp-1">
                        {c.description || 'Sin descripción'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5 ${
                          c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${c.active ? 'bg-emerald-500' : 'bg-gray-400'}`}
                        />
                        {c.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditarModal(c)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => void handleEliminar(c.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!cargando && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No se encontraron categorías</p>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Categoria */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
            <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-xl text-sm">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                  Nombre de la categoría *
                </label>
                <Input
                  placeholder="Ej. Accesorios, Tecnología..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  placeholder="Breve detalle sobre la categoría..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full min-h-[80px] px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-sm text-body transition-colors"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="categoryActive"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-4 h-4 accent-secondary rounded focus:ring-secondary"
                />
                <label htmlFor="categoryActive" className="text-sm text-gray-700 font-medium select-none cursor-pointer">
                  Categoría activa (visible en el marketplace)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-50">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
