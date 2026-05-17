'use client'

import { X } from 'lucide-react'
import { TextField } from '@/components/atoms/TextField/TextField'
import { TextArea } from '@/components/atoms/TextArea/TextArea'
import { ImagePicker } from '@/components/molecules/ImagePicker/ImagePicker'
import type { PilarItem } from '@/src/utils/editor-types.d'

interface EditorPilaresProps {
  pilares: PilarItem[]
  onChange: (pilares: PilarItem[]) => void
}

/**
 * Editor de pilares para la seccion de pilares y caracteristicas.
 * Permite agregar, editar y eliminar pilares con icono, titulo, texto y boton.
 */
export function EditorPilares({ pilares, onChange }: EditorPilaresProps) {
  return (
    <div className="flex flex-col gap-3">
      {pilares.map((pilar, idx) => (
        <div key={pilar.id} className="rounded-xl border border-gray-100 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Pilar {idx + 1}
            </span>
            <button
              type="button"
              onClick={() => onChange(pilares.filter((_, i) => i !== idx))}
              className="text-gray-300 transition-colors hover:text-red-500"
            >
              <X className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <TextField
              label="Titulo"
              value={pilar.titulo}
              onChange={(v) => {
                const n = pilares.map((p, i) => (i === idx ? { ...p, titulo: v } : p))
                onChange(n)
              }}
              placeholder="Ej: Seguridad"
            />
            <ImagePicker
              label="Icono"
              value={pilar.icono}
              onChange={(v) => {
                const n = pilares.map((p, i) => (i === idx ? { ...p, icono: v } : p))
                onChange(n)
              }}
            />
            <TextArea
              label="Texto"
              value={pilar.texto}
              onChange={(v) => {
                const n = pilares.map((p, i) => (i === idx ? { ...p, texto: v } : p))
                onChange(n)
              }}
              placeholder="Descripcion del pilar"
            />
            <div className="grid grid-cols-2 gap-2">
              <TextField
                label="Texto boton"
                value={pilar.textoBoton}
                onChange={(v) => {
                  const n = pilares.map((p, i) => (i === idx ? { ...p, textoBoton: v } : p))
                  onChange(n)
                }}
                placeholder="CTA"
              />
              <TextField
                label="Enlace"
                value={pilar.enlaceBoton}
                onChange={(v) => {
                  const n = pilares.map((p, i) => (i === idx ? { ...p, enlaceBoton: v } : p))
                  onChange(n)
                }}
                placeholder="/ruta"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...pilares,
            {
              id: crypto.randomUUID(),
              icono: '',
              titulo: '',
              texto: '',
              textoBoton: '',
              enlaceBoton: '',
            },
          ])
        }
        className="rounded-xl border border-dashed border-gray-200 py-3 text-xs font-medium text-secondary transition-colors hover:border-secondary hover:bg-secondary/5"
      >
        + Agregar pilar
      </button>
    </div>
  )
}
