'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { marketplaceService } from '@/src/services/marketplace.service'
import { authService } from '@/src/services/auth.service'

export interface Marketplace {
  id: string
  nombre: string
  slug: string
  propietario: string
  activo: boolean
  descripcion: string
}

/**
 * Hook personalizado para manejar la lógica de estado y negocio de la administración de marketplaces.
 * Abstrae el CRUD multiversión, activación, eliminación y seguridad visual premium de los marketplaces.
 */
export function useMarketplaces() {
  const [search, setSearch] = useState('')
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([])
  const [cargando, setCargando] = useState(true)
  const [session, setSession] = useState<any>(null)

  // Estados para el Modal de Creación
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoSlug, setNuevoSlug] = useState('')
  const [nuevaDesc, setNuevaDesc] = useState('')
  const [nuevoPropietario, setNuevoPropietario] = useState('')
  const [errorModal, setErrorModal] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargarMarketplaces = useCallback(async () => {
    try {
      setCargando(true)
      const data = await marketplaceService.list()
      const userSession = authService.getSession()
      setSession(userSession)

      // Si no es ADMIN, filtrar los marketplaces que pertenezcan a su propietario
      if (userSession && userSession.role !== 'ADMIN') {
        const filtrados = data.filter((m) => m.propietario === userSession.owner)
        setMarketplaces(filtrados)
      } else {
        setMarketplaces(data)
      }
    } catch {
      setMarketplaces([])
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargarMarketplaces()
  }, [cargarMarketplaces])

  // Activar una versión específica del marketplace para rotarla
  const activarMarketplace = async (id: string) => {
    try {
      setCargando(true)
      const config = await marketplaceService.getById(id)
      config.activo = true
      // Guardar cambios en el backend (el backend desactivará los otros marketplaces con el mismo slug)
      await marketplaceService.update(id, config)
      await cargarMarketplaces()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al activar la configuración.')
    } finally {
      setCargando(false)
    }
  }

  // Eliminar una versión inactiva
  const eliminarMarketplace = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta versión de configuración?')) return
    try {
      setCargando(true)
      await marketplaceService.delete(id)
      await cargarMarketplaces()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar.')
    } finally {
      setCargando(false)
    }
  }

  // Crear una nueva configuración
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorModal('')

    if (!nuevoNombre.trim()) {
      setErrorModal('El nombre de la configuración es obligatorio.')
      return
    }
    if (!nuevoSlug.trim()) {
      setErrorModal('El slug es obligatorio.')
      return
    }

    try {
      setGuardando(true)
      // Si no es ADMIN, asigna automáticamente su owner actual
      const propietarioFinal = session?.role === 'ADMIN' 
        ? nuevoPropietario.trim() 
        : (session?.owner || '')

      await marketplaceService.create({
        nombre: nuevoNombre.trim(),
        slug: nuevoSlug.trim().toLowerCase(),
        descripcion: nuevaDesc.trim(),
        propietario: propietarioFinal,
      })

      // Limpiar y cerrar modal
      setNuevoNombre('')
      setNuevoSlug('')
      setNuevaDesc('')
      setNuevoPropietario('')
      setModalAbierto(false)
      
      // Recargar lista
      await cargarMarketplaces()
    } catch (err) {
      setErrorModal(err instanceof Error ? err.message : 'Error al crear la configuración.')
    } finally {
      setGuardando(false)
    }
  }

  const filtered = useMemo(() => {
    return marketplaces.filter(
      (m) =>
        m.nombre.toLowerCase().includes(search.toLowerCase()) ||
        m.slug.toLowerCase().includes(search.toLowerCase()) ||
        m.propietario.toLowerCase().includes(search.toLowerCase()),
    )
  }, [search, marketplaces])

  const esAdmin = useMemo(() => {
    return session?.role === 'ADMIN'
  }, [session])

  return {
    search,
    setSearch,
    marketplaces,
    cargando,
    session,
    modalAbierto,
    setModalAbierto,
    nuevoNombre,
    setNuevoNombre,
    nuevoSlug,
    setNuevoSlug,
    nuevaDesc,
    setNuevaDesc,
    nuevoPropietario,
    setNuevoPropietario,
    errorModal,
    setErrorModal,
    guardando,
    activarMarketplace,
    eliminarMarketplace,
    handleCrear,
    filtered,
    esAdmin,
  }
}
