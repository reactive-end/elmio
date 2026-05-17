'use client'

import { SectionListPanel } from './SectionListPanel'
import { SectionPropertiesPanel } from './SectionPropertiesPanel'
import type { SeccionMarketplace, EstiloSeccion } from '@/src/utils/editor-types.d'

type PestanaPropiedades = 'contenido' | 'estilos' | 'elementos'

interface EdicionTabProps {
  secciones: SeccionMarketplace[]
  seleccionada: SeccionMarketplace | null
  seleccionadaId: string | null
  pestanaProp: PestanaPropiedades
  fuente: string
  gradienteActivo: boolean
  gradienteInicio: string
  gradienteFin: string
  gradienteDireccion: string
  onSelectSeccion: (id: string) => void
  onAgregarClick: () => void
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
  actualizarContenido: (campo: keyof SeccionMarketplace['contenido'], valor: string) => void
  actualizarEstilo: (campo: keyof EstiloSeccion, valor: string | number | boolean) => void
  setPestanaProp: (p: PestanaPropiedades) => void
  agregarElemento: () => void
  actualizarElemento: (id: string, campo: string, valor: string) => void
  eliminarElemento: (id: string) => void
  onGradienteActivoChange: (v: boolean) => void
  onGradienteInicioChange: (c: string) => void
  onGradienteFinChange: (c: string) => void
  onGradienteDireccionChange: (d: string) => void
  onFuenteChange: (f: string) => void
}

/**
 * Pestaña de edicion del marketplace.
 * Panel izquierdo: lista de secciones. Panel derecho: propiedades de la seccion seleccionada.
 */
export function EdicionTab({
  secciones,
  seleccionada,
  seleccionadaId,
  pestanaProp,
  fuente,
  gradienteActivo,
  gradienteInicio,
  gradienteFin,
  gradienteDireccion,
  onSelectSeccion,
  onAgregarClick,
  actualizarSeccion,
  actualizarContenido,
  actualizarEstilo,
  setPestanaProp,
  agregarElemento,
  actualizarElemento,
  eliminarElemento,
  onGradienteActivoChange,
  onGradienteInicioChange,
  onGradienteFinChange,
  onGradienteDireccionChange,
  onFuenteChange,
}: EdicionTabProps) {
  return (
    <div className="flex-1 flex gap-4 min-h-0">
      <SectionListPanel
        secciones={secciones}
        seleccionadaId={seleccionadaId}
        onSelect={onSelectSeccion}
        onAgregar={onAgregarClick}
      />
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto min-w-0">
        <SectionPropertiesPanel
          seccion={seleccionada}
          pestanaProp={pestanaProp}
          fuente={fuente}
          gradienteActivo={gradienteActivo}
          gradienteInicio={gradienteInicio}
          gradienteFin={gradienteFin}
          gradienteDireccion={gradienteDireccion}
          actualizarSeccion={actualizarSeccion}
          actualizarContenido={actualizarContenido}
          actualizarEstilo={actualizarEstilo}
          setPestanaProp={setPestanaProp}
          agregarElemento={agregarElemento}
          actualizarElemento={actualizarElemento}
          eliminarElemento={eliminarElemento}
          onGradienteActivoChange={onGradienteActivoChange}
          onGradienteInicioChange={onGradienteInicioChange}
          onGradienteFinChange={onGradienteFinChange}
          onGradienteDireccionChange={onGradienteDireccionChange}
          onFuenteChange={onFuenteChange}
        />
      </div>
    </div>
  )
}
