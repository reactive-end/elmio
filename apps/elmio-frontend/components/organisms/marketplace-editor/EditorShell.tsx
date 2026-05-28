'use client'

import { useState, useEffect } from 'react'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { EditorTopBar } from './EditorTopBar'
import { SeccionesTab } from './SeccionesTab'
import { EdicionTab } from './EdicionTab'
import { VistaPreviaTab } from './VistaPreviaTab'
import { ConfiguracionGeneralTab } from './ConfiguracionGeneralTab'
import { AgregarSeccionModal } from './AgregarSeccionModal'
import { useMarketplaceEditor } from '@/src/hooks/pages/useMarketplaceEditor'
import { MERCADO_PRUEBA } from '@/src/data/marketplace-mock'
import { marketplaceService } from '@/src/services/marketplace.service'
import { authService } from '@/src/services/auth.service'
import { ShieldAlert } from 'lucide-react'
import type { DatosMarketplace, TipoSeccion, ConfiguracionWhatsApp } from '@/src/utils/editor-types.d'

type PestanaEditor = 'vista-previa' | 'edicion' | 'secciones' | 'general'
type PestanaPropiedades = 'contenido' | 'estilos' | 'elementos'

interface EditorShellProps {
  id: string
}

/**
 * Shell principal del editor de marketplace.
 * Carga la configuracion desde el backend, compone el editor completo
 * y persiste los cambios al guardar.
 */
export function EditorShell({ id }: EditorShellProps) {
  const [datosIniciales, setDatosIniciales] = useState<DatosMarketplace | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelado = false

    const cargar = async () => {
      try {
        const data = await marketplaceService.getById(id)
        if (!cancelado) {
          setDatosIniciales(data)
        }
      } catch {
        if (!cancelado) {
          setDatosIniciales(MERCADO_PRUEBA)
        }
      } finally {
        if (!cancelado) {
          setCargando(false)
        }
      }
    }

    void cargar()

    return () => {
      cancelado = true
    }
  }, [id])

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-sm text-gray-500">Cargando marketplace...</p>
        </div>
      </div>
    )
  }

  return <EditorInterno datosIniciales={datosIniciales ?? MERCADO_PRUEBA} />
}

import { MarketplaceEditorProvider } from './MarketplaceEditorContext'
import { ConfirmModal } from '@/components/molecules/ConfirmModal/ConfirmModal'

interface EditorInternoProps {
  datosIniciales: DatosMarketplace
}

function EditorInterno({ datosIniciales }: EditorInternoProps) {
  const editor = useMarketplaceEditor(datosIniciales)
  const [session, setSession] = useState<any>(null)
  const [seccionArrastradaId, setSeccionArrastradaId] = useState<string | null>(null)
  const [objetivoArrastre, setObjetivoArrastre] = useState<{
    id: string
    posicion: 'antes' | 'despues'
  } | null>(null)
  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false)
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoSeccion>('principal')
  const [seccionParaEliminarId, setSeccionParaEliminarId] = useState<string | null>(null)

  useEffect(() => {
    setSession(authService.getSession())
  }, [])

  const abrirModalAgregar = () => {
    setTipoSeleccionado('principal')
    setModalAgregarAbierto(true)
  }

  const confirmarAgregarSeccion = () => {
    editor.agregarSeccion(tipoSeleccionado)
    setModalAgregarAbierto(false)
  }

  const handleDrop = () => {
    if (!seccionArrastradaId || !objetivoArrastre) return
    editor.reordenarSeccion(seccionArrastradaId, objetivoArrastre.id, objetivoArrastre.posicion)
    setSeccionArrastradaId(null)
    setObjetivoArrastre(null)
  }

  const handleEliminarSeccionClick = (id: string) => {
    setSeccionParaEliminarId(id)
  }

  const confirmarEliminarSeccion = () => {
    if (seccionParaEliminarId) {
      editor.eliminarSeccion(seccionParaEliminarId)
      setSeccionParaEliminarId(null)
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        editor.guardar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editor])

  const esAdminGlobalAjeno = 
    session?.role === 'ADMIN' && 
    editor.marketplace.propietario && 
    editor.marketplace.propietario !== session?.owner

  const tenantDirectory = editor.marketplace.propietario || 'elmio'

  return (
    <MarketplaceEditorProvider tenantDirectory={tenantDirectory}>
      <div className="h-[calc(100dvh-8rem)] flex flex-col">
        {esAdminGlobalAjeno && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-3 text-amber-800 text-xs font-semibold animate-fade-in flex-shrink-0">
            <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
            <span>
              Editando en modo <strong>Administrador Global:</strong> Los cambios no afectarán la propiedad original del aliado (<code>{editor.marketplace.propietario}</code>).
            </span>
          </div>
        )}

        <EditorTopBar
          nombre={editor.marketplace.nombre}
          slug={editor.marketplace.slug}
          pestana={editor.pestana as PestanaEditor}
          onNombreChange={(v) => editor.setMarketplace({ ...editor.marketplace, nombre: v })}
          onPestanaChange={(p) => editor.setPestana(p as PestanaEditor)}
          onGuardar={editor.guardar}
          onDeshacer={editor.deshacer}
          onRehacer={editor.rehacer}
          puedeDeshacer={editor.puedeDeshacer}
          puedeRehacer={editor.puedeRehacer}
        />

        {editor.alerta && (
          <div className="mb-4 flex-shrink-0">
            <Alert
               type={editor.alerta.type}
               message={editor.alerta.message}
               onDismiss={() => editor.setAlerta(null)}
            />
          </div>
        )}

        {editor.pestana === 'vista-previa' && (
          <VistaPreviaTab
            secciones={editor.secciones}
            seleccionadaId={editor.seleccionadaId}
            onSeccionClick={(id) => {
              editor.setSeleccionadaId(id)
              editor.setPestana('edicion')
            }}
            carritoActivo={editor.marketplace.carrito?.activo ?? true}
          />
        )}

        {editor.pestana === 'edicion' && (
          <EdicionTab
            secciones={editor.secciones}
            seleccionada={editor.seleccionada}
            seleccionadaId={editor.seleccionadaId}
            pestanaProp={editor.pestanaProp as PestanaPropiedades}
            fuente={editor.marketplace.tema.fuente}
            gradienteActivo={editor.gradienteActivo}
            gradienteInicio={editor.gradienteInicio}
            gradienteFin={editor.gradienteFin}
            gradienteDireccion={editor.gradienteDireccion}
            onSelectSeccion={(sId) => editor.setSeleccionadaId(sId)}
            onAgregarClick={abrirModalAgregar}
            actualizarSeccion={editor.actualizarSeccion}
            actualizarContenido={editor.actualizarContenido}
            actualizarEstilo={(campo, valor) =>
              editor.actualizarEstilo(campo, valor as string | number)
            }
            setPestanaProp={(p) => editor.setPestanaProp(p as PestanaPropiedades)}
            agregarElemento={editor.agregarElemento}
            actualizarElemento={editor.actualizarElemento}
            eliminarElemento={editor.eliminarElemento}
            onGradienteActivoChange={editor.setGradienteActivo}
            onGradienteInicioChange={editor.setGradienteInicio}
            onGradienteFinChange={editor.setGradienteFin}
            onGradienteDireccionChange={editor.setGradienteDireccion}
            onFuenteChange={(f) =>
              editor.setMarketplace({
                ...editor.marketplace,
                tema: { ...editor.marketplace.tema, fuente: f },
              })
            }
          />
        )}

        {editor.pestana === 'secciones' && (
          <SeccionesTab
            secciones={editor.secciones}
            seccionArrastradaId={seccionArrastradaId}
            objetivoArrastre={objetivoArrastre}
            onAgregarClick={abrirModalAgregar}
            onDragStart={setSeccionArrastradaId}
            onDragEnd={() => {
              setSeccionArrastradaId(null)
              setObjetivoArrastre(null)
            }}
            onDragOver={(seccionId, posicion) => setObjetivoArrastre({ id: seccionId, posicion })}
            onDragLeave={() => setObjetivoArrastre(null)}
            onDrop={handleDrop}
            onVisibilidad={editor.toggleVisibilidad}
            onEditar={(sId) => {
              editor.setSeleccionadaId(sId)
              editor.setPestana('edicion')
            }}
            onEliminar={handleEliminarSeccionClick}
          />
        )}

        {editor.pestana === 'general' && (
          <ConfiguracionGeneralTab
            whatsapp={editor.marketplace.whatsapp}
            onChangeWhatsapp={(ws) =>
              editor.setMarketplace({ ...editor.marketplace, whatsapp: ws })
            }
            carrito={editor.marketplace.carrito}
            onChangeCarrito={(cart) =>
              editor.setMarketplace({ ...editor.marketplace, carrito: cart })
            }
          />
        )}

        <AgregarSeccionModal
          abierto={modalAgregarAbierto}
          tipoSeleccionado={tipoSeleccionado}
          onTipoChange={setTipoSeleccionado}
          onConfirmar={confirmarAgregarSeccion}
          onCancelar={() => setModalAgregarAbierto(false)}
        />

        {editor.guardando && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-3 font-medium animate-fadeIn">
            <Spinner />
            <span className="text-sm font-semibold tracking-wide">Guardando cambios...</span>
          </div>
        )}

        <ConfirmModal
          isOpen={seccionParaEliminarId !== null}
          onClose={() => setSeccionParaEliminarId(null)}
          onConfirm={confirmarEliminarSeccion}
          title="¿Eliminar esta sección?"
          description="Esta sección y todo su contenido configurado se eliminarán permanentemente del marketplace. ¿Deseas continuar?"
          confirmText="Sí, eliminar sección"
          cancelText="Cancelar"
        />
      </div>
    </MarketplaceEditorProvider>
  )
}
