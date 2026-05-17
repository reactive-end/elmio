'use client'

import { Type, Palette, LayoutGrid } from 'lucide-react'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { ContenidoSeccionPanel } from './ContenidoSeccionPanel'
import { EstilosEditor } from './EstilosEditor'
import { ElementosList } from './ElementosList'
import { etiquetaTipo } from '@/src/data/marketplace-mock'
import type { SeccionMarketplace, TipoSeccion, EstiloSeccion } from '@/src/utils/editor-types.d'

type PestanaPropiedades = 'contenido' | 'estilos' | 'elementos'

const tiposDisponibles: TipoSeccion[] = [
  'cabecera',
  'principal',
  'caracteristicas',
  'productos',
  'banner',
  'doble-banner',
  'aliados',
  'pilares',
  'franja',
  'texto',
  'pie',
]

interface SectionPropertiesPanelProps {
  seccion: SeccionMarketplace | null
  pestanaProp: PestanaPropiedades
  fuente: string
  gradienteActivo: boolean
  gradienteInicio: string
  gradienteFin: string
  gradienteDireccion: string
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
 * Panel de propiedades de la seccion seleccionada.
 * Contiene los campos de nombre, tipo y las pestañas de Contenido, Estilos y Elementos.
 */
export function SectionPropertiesPanel({
  seccion,
  pestanaProp,
  fuente,
  gradienteActivo,
  gradienteInicio,
  gradienteFin,
  gradienteDireccion,
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
}: SectionPropertiesPanelProps) {
  if (!seccion) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm p-8 text-center">
        Selecciona una seccion en el panel izquierdo para editar sus propiedades
      </div>
    )
  }

  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-medium text-gray-400">Nombre de la seccion</label>
        <Input
          value={seccion.nombre}
          onChange={(e) => actualizarSeccion(seccion.id, { nombre: e.target.value })}
          className="text-sm font-semibold"
        />
        <label className="text-[10px] font-medium text-gray-400">Tipo de seccion</label>
        <Select
          value={seccion.tipo}
          onChange={(v) => actualizarSeccion(seccion.id, { tipo: v as TipoSeccion })}
          options={tiposDisponibles.map((t) => ({ value: t, label: etiquetaTipo[t] }))}
        />
      </div>

      <div className="flex border-b border-gray-100">
        {[
          { id: 'contenido' as PestanaPropiedades, icon: Type, label: 'Contenido' },
          { id: 'estilos' as PestanaPropiedades, icon: Palette, label: 'Estilos' },
          {
            id: 'elementos' as PestanaPropiedades,
            icon: LayoutGrid,
            label: `Elementos (${seccion.contenido.elementos.length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPestanaProp(tab.id)}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium transition-colors border-b-2 ${
              pestanaProp === tab.id
                ? 'text-secondary border-secondary'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            <tab.icon className="w-3 h-3" strokeWidth={1.5} />
            {tab.label}
          </button>
        ))}
      </div>

      {pestanaProp === 'contenido' && (
        <ContenidoSeccionPanel
          seccion={seccion}
          actualizarContenido={actualizarContenido}
          actualizarSeccion={actualizarSeccion}
        />
      )}

      {pestanaProp === 'estilos' && (
        <EstilosEditor
          seccion={seccion}
          fuente={fuente}
          gradienteActivo={gradienteActivo}
          gradienteInicio={gradienteInicio}
          gradienteFin={gradienteFin}
          gradienteDireccion={gradienteDireccion}
          actualizarEstilo={actualizarEstilo}
          onGradienteActivoChange={onGradienteActivoChange}
          onGradienteInicioChange={onGradienteInicioChange}
          onGradienteFinChange={onGradienteFinChange}
          onGradienteDireccionChange={onGradienteDireccionChange}
          onFuenteChange={onFuenteChange}
        />
      )}

      {pestanaProp === 'elementos' && (
        <ElementosList
          elementos={seccion.contenido.elementos}
          onAgregar={agregarElemento}
          onActualizar={actualizarElemento}
          onEliminar={eliminarElemento}
        />
      )}
    </div>
  )
}
