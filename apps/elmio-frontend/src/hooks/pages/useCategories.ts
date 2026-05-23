'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { categoryService, type Categoria } from '@/src/services/category.service'

/**
 * Hook personalizado para encapsular la lógica de negocio y gestión de estados
 * de la página de administración de categorías del catálogo.
 */
export function useCategories() {
  const [search, setSearch] = useState('')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Estados de los modales
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null)

  // Campos del formulario
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const cargarCategorias = useCallback(async () => {
    setCargando(true)
    setErrorMsg(null)
    try {
      const data = await categoryService.list()
      setCategorias(data)
    } catch {
      setErrorMsg('Error al conectar con el servidor de categorías.')
      setCategorias([])
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargarCategorias()
  }, [cargarCategorias])

  const openCrearModal = () => {
    setEditingCategory(null)
    setFormName('')
    setFormDescription('')
    setFormActive(true)
    setErrorMsg(null)
    setIsModalOpen(true)
  }

  const openEditarModal = (cat: Categoria) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormDescription(cat.description)
    setFormActive(cat.active)
    setErrorMsg(null)
    setIsModalOpen(true)
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      await categoryService.delete(id)
      setSuccessMsg('Categoría eliminada exitosamente.')
      void cargarCategorias()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al eliminar la categoría.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      setErrorMsg('El nombre es obligatorio.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      if (editingCategory) {
        // Modificar
        await categoryService.update(editingCategory.id, {
          name: formName.trim(),
          description: formDescription.trim(),
          active: formActive,
        })
        setSuccessMsg('Categoría actualizada exitosamente.')
      } else {
        // Crear
        await categoryService.create({
          name: formName.trim(),
          description: formDescription.trim(),
          active: formActive,
        })
        setSuccessMsg('Categoría creada exitosamente.')
      }

      setIsModalOpen(false)
      void cargarCategorias()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al procesar la solicitud.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = useMemo(() => {
    return categorias.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase()),
    )
  }, [search, categorias])

  return {
    search,
    setSearch,
    categorias,
    cargando,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
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
  }
}
