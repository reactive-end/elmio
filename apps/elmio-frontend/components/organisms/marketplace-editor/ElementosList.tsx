'use client'

import { X } from 'lucide-react'
import { TextField } from '@/components/atoms/TextField/TextField'
import { ImagePicker } from '@/components/molecules/ImagePicker/ImagePicker'
import type { ElementoSeccion } from '@/src/utils/editor-types.d'

interface ElementosListProps {
  elementos: ElementoSeccion[]
  onAgregar: () => void
  onActualizar: (id: string, campo: string, valor: string) => void
  onEliminar: (id: string) => void
}

/**
 * Lista de elementos editables para una seccion del marketplace.
 * Soporta CRUD de elementos con campos de titulo, descripcion, icono, imagen y enlace.
 */
export function ElementosList({
  elementos,
  onAgregar,
  onActualizar,
  onEliminar,
}: ElementosListProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase">
          {elementos.length} elementos
        </span>
        <button
          type="button"
          onClick={onAgregar}
          className="text-xs text-secondary hover:text-secondary-dark font-medium"
        >
          + Agregar elemento
        </button>
      </div>
      {elementos.map((elem, idx) => (
        <div key={elem.id} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Elemento {idx + 1}</span>
            <button
              type="button"
              onClick={() => onEliminar(elem.id)}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" strokeWidth={1.5} />
            </button>
          </div>
          <TextField
            label="Titulo"
            value={elem.titulo}
            onChange={(v) => onActualizar(elem.id, 'titulo', v)}
          />
          <TextField
            label="Descripcion"
            value={elem.descripcion}
            onChange={(v) => onActualizar(elem.id, 'descripcion', v)}
          />
          <TextField
            label="Icono"
            value={elem.icono}
            onChange={(v) => onActualizar(elem.id, 'icono', v)}
            placeholder="Star"
          />
          <ImagePicker
            label="Imagen"
            value={elem.imagenUrl}
            onChange={(value) => onActualizar(elem.id, 'imagenUrl', value)}
          />
          <TextField
            label="Enlace"
            value={elem.enlaceUrl}
            onChange={(v) => onActualizar(elem.id, 'enlaceUrl', v)}
          />
        </div>
      ))}
    </div>
  )
}
