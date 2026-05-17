'use client'

import { Toggle } from '@/components/atoms/Toggle/Toggle'
import { ColorInput } from '@/components/molecules/ColorInput/ColorInput'
import { Select } from '@/components/atoms/Select/Select'
import type { GradientBuilderProps } from './GradientBuilder.d'

const DIRECCIONES = [
  { value: '135deg', label: 'Diagonal \u2197' },
  { value: '45deg', label: 'Diagonal \u2196' },
  { value: '225deg', label: 'Diagonal \u2199' },
  { value: '315deg', label: 'Diagonal \u2198' },
  { value: '0deg', label: 'Horizontal \u2192' },
  { value: '90deg', label: 'Vertical \u2193' },
]

/**
 * Componente molecule para construir un degradado de dos colores.
 * Muestra un toggle para activarlo, dos selectores de color y una previsualizacion.
 */
export function GradientBuilder({
  label,
  colorInicio,
  colorFin,
  direccion,
  activo,
  onActivoChange,
  onColorInicioChange,
  onColorFinChange,
  onDireccionChange,
}: GradientBuilderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-medium text-gray-400">{label}</label>
        <Toggle checked={activo} onChange={onActivoChange} />
      </div>

      {activo && (
        <div className="flex flex-col gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
          {/* Preview bar */}
          <div
            className="h-8 rounded-lg border border-gray-200"
            style={{
              backgroundImage: `linear-gradient(${direccion}, ${colorInicio || '#0f4ece'}, ${colorFin || '#13ce99'})`,
            }}
          />

          <div className="grid grid-cols-2 gap-2">
            <ColorInput label="Color inicial" value={colorInicio} onChange={onColorInicioChange} />
            <ColorInput label="Color final" value={colorFin} onChange={onColorFinChange} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-gray-400">Direccion</label>
            <Select
              value={direccion}
              onChange={onDireccionChange}
              options={DIRECCIONES}
            />
          </div>
        </div>
      )}
    </div>
  )
}
