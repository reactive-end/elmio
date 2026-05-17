'use client'

import { Button } from '@/components/atoms/Button/Button'
import { Select } from '@/components/atoms/Select/Select'
import { etiquetaTipo } from '@/src/data/marketplace-mock'
import type { TipoSeccion } from '@/src/utils/editor-types.d'

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

interface AgregarSeccionModalProps {
  abierto: boolean
  tipoSeleccionado: TipoSeccion
  onTipoChange: (tipo: TipoSeccion) => void
  onConfirmar: () => void
  onCancelar: () => void
}

/**
 * Modal para agregar una nueva seccion al marketplace.
 * Permite seleccionar el tipo de seccion entre las opciones disponibles.
 */
export function AgregarSeccionModal({
  abierto,
  tipoSeleccionado,
  onTipoChange,
  onConfirmar,
  onCancelar,
}: AgregarSeccionModalProps) {
  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
      onClick={onCancelar}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Nueva seccion
          </p>
          <h3 className="mt-1 text-lg font-semibold text-body">Selecciona el tipo de seccion</h3>
        </div>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-gray-400">Tipo de seccion</label>
            <Select
              value={tipoSeleccionado}
              onChange={(v) => onTipoChange(v as TipoSeccion)}
              options={tiposDisponibles.map((tipo) => ({ value: tipo, label: etiquetaTipo[tipo] }))}
            />
          </div>
          <p className="text-xs leading-5 text-gray-400">
            Cada tipo tiene su propio panel de configuracion en la pestaña Contenido del editor.
          </p>
        </div>
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <Button type="button" variant="ghost" fullWidth onClick={onCancelar}>
            Cancelar
          </Button>
          <Button type="button" fullWidth onClick={onConfirmar}>
            Agregar seccion
          </Button>
        </div>
      </div>
    </div>
  )
}
