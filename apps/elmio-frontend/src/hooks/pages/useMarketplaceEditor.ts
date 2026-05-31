'use client'

import { useState, useCallback } from 'react'
import type {
  SeccionMarketplace,
  TipoSeccion,
  EstiloSeccion,
  ContenidoSeccion,
  DatosMarketplace,
} from '@/src/utils/editor-types.d'
import { estiloPorDefecto } from '@/src/data/marketplace-mock'
import { marketplaceService } from '@/src/services/marketplace.service'

type PestanaEditor = 'vista-previa' | 'edicion' | 'secciones' | 'general'
type PestanaPropiedades = 'contenido' | 'estilos' | 'elementos'

interface AlertaState {
  type: 'success' | 'info' | 'error' | 'warning'
  message: string
}

export interface UseMarketplaceEditorReturn {
  marketplace: DatosMarketplace
  secciones: SeccionMarketplace[]
  seleccionadaId: string | null
  seleccionada: SeccionMarketplace | null
  pestana: PestanaEditor
  pestanaProp: PestanaPropiedades
  alerta: AlertaState | null
  mostrarMenuAgregar: boolean
  gradienteActivo: boolean
  gradienteInicio: string
  gradienteFin: string
  gradienteDireccion: string
  guardando: boolean
  puedeDeshacer: boolean
  puedeRehacer: boolean
  setMarketplace: (m: DatosMarketplace) => void
  setSeleccionadaId: (id: string | null) => void
  setPestana: (p: PestanaEditor) => void
  setPestanaProp: (p: PestanaPropiedades) => void
  setAlerta: (a: AlertaState | null) => void
  setMostrarMenuAgregar: (v: boolean) => void
  setGradienteActivo: (v: boolean) => void
  setGradienteInicio: (c: string) => void
  setGradienteFin: (c: string) => void
  setGradienteDireccion: (d: string) => void
  construirGradiente: () => string
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
  actualizarContenido: (campo: keyof ContenidoSeccion, valor: string) => void
  actualizarEstilo: (campo: keyof EstiloSeccion, valor: string | number | boolean) => void
  agregarElemento: () => void
  actualizarElemento: (id: string, campo: string, valor: string) => void
  eliminarElemento: (id: string) => void
  agregarSeccion: (tipo: TipoSeccion) => void
  toggleVisibilidad: (id: string) => void
  moverSeccion: (id: string, direccion: 'arriba' | 'abajo') => void
  reordenarSeccion: (origenId: string, destinoId: string, posicion?: 'antes' | 'despues') => void
  eliminarSeccion: (id: string) => void
  guardar: () => Promise<void>
  deshacer: () => void
  rehacer: () => void
}

export function useMarketplaceEditor(mercadoInicial: DatosMarketplace): UseMarketplaceEditorReturn {
  const [marketplace, setMarketplace] = useState(mercadoInicial)
  const [secciones, setSecciones] = useState<SeccionMarketplace[]>(mercadoInicial.secciones)
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(secciones[0]?.id ?? null)
  const [pestana, setPestana] = useState<PestanaEditor>('secciones')
  const [pestanaProp, setPestanaProp] = useState<PestanaPropiedades>('contenido')
  const [alerta, setAlerta] = useState<AlertaState | null>(null)
  const [mostrarMenuAgregar, setMostrarMenuAgregar] = useState(false)

  const [gradienteActivo, setGradienteActivo] = useState(false)
  const [gradienteInicio, setGradienteInicio] = useState('#0f4ece')
  const [gradienteFin, setGradienteFin] = useState('#13ce99')
  const [gradienteDireccion, setGradienteDireccion] = useState('135deg')

  // Estados locales para el Historial (Undo / Redo)
  const [past, setPast] = useState<SeccionMarketplace[][]>([])
  const [future, setFuture] = useState<SeccionMarketplace[][]>([])
  const [guardando, setGuardando] = useState(false)

  const puedeDeshacer = past.length > 0
  const puedeRehacer = future.length > 0

  const construirGradiente = () =>
    `linear-gradient(${gradienteDireccion}, ${gradienteInicio}, ${gradienteFin})`

  const seleccionada = secciones.find((s) => s.id === seleccionadaId) ?? null

  // Guardar estado profundo antes de cualquier cambio discreto
  const registrarHistorial = useCallback((seccionesActuales: SeccionMarketplace[]) => {
    const clon = JSON.parse(JSON.stringify(seccionesActuales)) as SeccionMarketplace[]
    setPast((prev) => [...prev, clon])
    setFuture([])
  }, [])

  const deshacer = useCallback(() => {
    if (past.length === 0) return
    const anterior = past[past.length - 1]
    const nuevoPast = past.slice(0, -1)

    const actualClon = JSON.parse(JSON.stringify(secciones)) as SeccionMarketplace[]
    setFuture((prev) => [actualClon, ...prev])
    setPast(nuevoPast)
    setSecciones(anterior)
  }, [past, secciones])

  const rehacer = useCallback(() => {
    if (future.length === 0) return
    const siguiente = future[0]
    const nuevoFuture = future.slice(1)

    const actualClon = JSON.parse(JSON.stringify(secciones)) as SeccionMarketplace[]
    setPast((prev) => [...prev, actualClon])
    setFuture(nuevoFuture)
    setSecciones(siguiente)
  }, [future, secciones])

  const actualizarSeccion = useCallback((id: string, cambios: Partial<SeccionMarketplace>) => {
    setSecciones((prev) => prev.map((s) => (s.id === id ? { ...s, ...cambios } : s)))
  }, [])

  const actualizarContenido = (campo: keyof ContenidoSeccion, valor: string) => {
    if (!seleccionada) return
    registrarHistorial(secciones)
    actualizarSeccion(seleccionada.id, { contenido: { ...seleccionada.contenido, [campo]: valor } })
  }

  const actualizarEstilo = (campo: keyof EstiloSeccion, valor: string | number | boolean) => {
    if (!seleccionada) return
    registrarHistorial(secciones)
    actualizarSeccion(seleccionada.id, { estilo: { ...seleccionada.estilo, [campo]: valor } })
  }

  const agregarElemento = () => {
    if (!seleccionada) return
    registrarHistorial(secciones)
    actualizarSeccion(seleccionada.id, {
      contenido: {
        ...seleccionada.contenido,
        elementos: [
          ...seleccionada.contenido.elementos,
          {
            id: crypto.randomUUID(),
            titulo: 'Nuevo elemento',
            descripcion: '',
            icono: 'Star',
            imagenUrl: '',
            enlaceUrl: '',
            textoBoton: '',
            enlaceBoton: '',
          },
        ],
      },
    })
  }

  const actualizarElemento = (id: string, campo: string, valor: string) => {
    if (!seleccionada) return
    // Guardar en el historial solo en el primer cambio de foco para no saturar al escribir
    // Opcionalmente se puede guardar en cada acción
    registrarHistorial(secciones)
    actualizarSeccion(seleccionada.id, {
      contenido: {
        ...seleccionada.contenido,
        elementos: seleccionada.contenido.elementos.map((e) =>
          e.id === id ? { ...e, [campo]: valor } : e,
        ),
      },
    })
  }

  const eliminarElemento = (id: string) => {
    if (!seleccionada) return
    registrarHistorial(secciones)
    actualizarSeccion(seleccionada.id, {
      contenido: {
        ...seleccionada.contenido,
        elementos: seleccionada.contenido.elementos.filter((e) => e.id !== id),
      },
    })
  }

  const agregarSeccion = (tipo: TipoSeccion) => {
    registrarHistorial(secciones)
    const nueva: SeccionMarketplace = {
      id: crypto.randomUUID(),
      nombre: `Nueva seccion ${secciones.length + 1}`,
      tipo,
      visible: true,
      orden: secciones.length,
      contenido: {
        titulo: '',
        subtitulo: '',
        descripcion: '',
        textoBoton: '',
        enlaceBoton: '',
        imagenUrl: '',
        elementos: [],
        productosIds: [],
        diapositivas: [],
        columnasPie: [],
        logoUrl: '',
        copyright: '',
        aliados: [],
        pilares: [],
        menu: [],
        cuerpoHtml: '',
        autoplay: tipo === 'principal' || tipo === 'franja' || tipo === 'productos',
        autoplayVelocidad: 5000,
        htmlId: '',
      },
      estilo: estiloPorDefecto(tipo),
    }
    setSecciones((prev) => [...prev, nueva])
    setSeleccionadaId(nueva.id)
    setMostrarMenuAgregar(false)
  }

  const toggleVisibilidad = (id: string) => {
    registrarHistorial(secciones)
    setSecciones((prev) => prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)))
  }

  const moverSeccion = (id: string, direccion: 'arriba' | 'abajo') => {
    registrarHistorial(secciones)
    setSecciones((prev) => {
      const idx = prev.findIndex((s) => s.id === id)
      if (idx === -1) return prev
      const nuevoIdx = direccion === 'arriba' ? idx - 1 : idx + 1
      if (nuevoIdx < 0 || nuevoIdx >= prev.length) return prev
      const copia = [...prev]
      ;[copia[idx], copia[nuevoIdx]] = [copia[nuevoIdx], copia[idx]]
      return copia.map((s, i) => ({ ...s, orden: i }))
    })
  }

  const reordenarSeccion = (
    origenId: string,
    destinoId: string,
    posicion: 'antes' | 'despues' = 'antes',
  ) => {
    if (origenId === destinoId) return
    registrarHistorial(secciones)
    setSecciones((prev) => {
      const origenIdx = prev.findIndex((s) => s.id === origenId)
      const destinoIdx = prev.findIndex((s) => s.id === destinoId)

      if (origenIdx === -1 || destinoIdx === -1) return prev

      const copia = [...prev]
      const [seccionMovida] = copia.splice(origenIdx, 1)

      if (!seccionMovida) return prev

      const destinoAjustado = origenIdx < destinoIdx ? destinoIdx - 1 : destinoIdx
      const indiceInsercion = posicion === 'antes' ? destinoAjustado : destinoAjustado + 1

      copia.splice(indiceInsercion, 0, seccionMovida)

      return copia.map((s, i) => ({ ...s, orden: i }))
    })
  }

  const eliminarSeccion = (id: string) => {
    registrarHistorial(secciones)
    setSecciones((prev) => prev.filter((s) => s.id !== id))
    if (seleccionadaId === id) setSeleccionadaId(null)
  }

  const guardar = async () => {
    // Validar campos de estilo numéricos vacíos
    for (const seccion of secciones) {
      const defaultEstilo = estiloPorDefecto(seccion.tipo)
      const camposVacios = Object.entries(seccion.estilo).filter(
        ([key, val]) => val === '' && typeof defaultEstilo[key as keyof EstiloSeccion] === 'number'
      )

      if (camposVacios.length > 0) {
        setAlerta({
          type: 'error',
          message: `No se pueden guardar los cambios. La sección "${seccion.nombre}" tiene campos numéricos vacíos en sus estilos.`,
        })
        setTimeout(() => setAlerta(null), 5000)
        return
      }
    }

    try {
      setGuardando(true)
      const datosGuardar: DatosMarketplace = {
        ...marketplace,
        secciones,
      }

      await marketplaceService.update(marketplace.id, datosGuardar)
      setAlerta({ type: 'success', message: 'Cambios guardados correctamente.' })
    } catch {
      setAlerta({ type: 'info', message: 'Error al guardar. Verifica la conexion con el backend.' })
    } finally {
      setGuardando(false)
    }

    setTimeout(() => setAlerta(null), 4000)
  }

  return {
    marketplace,
    secciones,
    seleccionadaId,
    seleccionada,
    pestana,
    pestanaProp,
    alerta,
    mostrarMenuAgregar,
    gradienteActivo,
    gradienteInicio,
    gradienteFin,
    gradienteDireccion,
    guardando,
    puedeDeshacer,
    puedeRehacer,
    setMarketplace,
    setSeleccionadaId,
    setPestana,
    setPestanaProp,
    setAlerta,
    setMostrarMenuAgregar,
    setGradienteActivo,
    setGradienteInicio,
    setGradienteFin,
    setGradienteDireccion,
    construirGradiente,
    actualizarSeccion,
    actualizarContenido,
    actualizarEstilo,
    agregarElemento,
    actualizarElemento,
    eliminarElemento,
    agregarSeccion,
    toggleVisibilidad,
    moverSeccion,
    reordenarSeccion,
    eliminarSeccion,
    guardar,
    deshacer,
    rehacer,
  }
}
