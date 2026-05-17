'use client'

import { X } from 'lucide-react'
import { TextField } from '@/components/atoms/TextField/TextField'
import { TextArea } from '@/components/atoms/TextArea/TextArea'
import { ImagePicker } from '@/components/molecules/ImagePicker/ImagePicker'
import type { Diapositiva } from '@/src/utils/editor-types.d'

interface EditorDiapositivasProps {
  diapositivas: Diapositiva[]
  onChange: (diapositivas: Diapositiva[]) => void
}

/**
 * Editor de diapositivas para secciones tipo principal y franja.
 * Permite agregar, editar y eliminar slides con imagen, titulo, texto y boton.
 */
export function EditorDiapositivas({ diapositivas, onChange }: EditorDiapositivasProps) {
  return (
    <div className="flex flex-col gap-3">
      {diapositivas.map((slide, idx) => (
        <div key={slide.id} className="rounded-xl border border-gray-100 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Slide {idx + 1}
            </span>
            <button
              type="button"
              onClick={() => onChange(diapositivas.filter((_, i) => i !== idx))}
              className="text-gray-300 transition-colors hover:text-red-500"
            >
              <X className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <ImagePicker
              label="Imagen"
              value={slide.imagen}
              onChange={(v) => {
                const nuevos = diapositivas.map((s, i) => (i === idx ? { ...s, imagen: v } : s))
                onChange(nuevos)
              }}
            />
            <TextField
              label="Titulo"
              value={slide.titulo}
              onChange={(v) => {
                const nuevos = diapositivas.map((s, i) => (i === idx ? { ...s, titulo: v } : s))
                onChange(nuevos)
              }}
              placeholder="Titulo de la slide"
            />
            <TextField
              label="Subtitulo"
              value={slide.subtitulo}
              onChange={(v) => {
                const nuevos = diapositivas.map((s, i) => (i === idx ? { ...s, subtitulo: v } : s))
                onChange(nuevos)
              }}
              placeholder="Subtitulo"
            />
            <TextArea
              label="Texto"
              value={slide.texto}
              onChange={(v) => {
                const nuevos = diapositivas.map((s, i) => (i === idx ? { ...s, texto: v } : s))
                onChange(nuevos)
              }}
              placeholder="Texto descriptivo"
            />
            <div className="grid grid-cols-2 gap-2">
              <TextField
                label="Texto boton"
                value={slide.textoBoton}
                onChange={(v) => {
                  const nuevos = diapositivas.map((s, i) =>
                    i === idx ? { ...s, textoBoton: v } : s,
                  )
                  onChange(nuevos)
                }}
                placeholder="CTA"
              />
              <TextField
                label="Enlace"
                value={slide.enlaceBoton}
                onChange={(v) => {
                  const nuevos = diapositivas.map((s, i) =>
                    i === idx ? { ...s, enlaceBoton: v } : s,
                  )
                  onChange(nuevos)
                }}
                placeholder="/productos"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...diapositivas,
            {
              id: crypto.randomUUID(),
              imagen: '',
              titulo: '',
              subtitulo: '',
              texto: '',
              textoBoton: '',
              enlaceBoton: '',
            },
          ])
        }
        className="rounded-xl border border-dashed border-gray-200 py-3 text-xs font-medium text-secondary transition-colors hover:border-secondary hover:bg-secondary/5"
      >
        + Agregar slide
      </button>
    </div>
  )
}
