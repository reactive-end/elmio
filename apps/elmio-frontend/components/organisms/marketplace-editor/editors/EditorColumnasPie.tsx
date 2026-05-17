'use client'

import { X } from 'lucide-react'
import { TextField } from '@/components/atoms/TextField/TextField'
import type { ColumnaPie } from '@/src/utils/editor-types.d'

interface EditorColumnasPieProps {
  columnas: ColumnaPie[]
  onChange: (columnas: ColumnaPie[]) => void
}

/**
 * Editor de columnas del pie de pagina.
 * Permite agregar, editar y eliminar columnas con titulo y enlaces.
 */
export function EditorColumnasPie({ columnas, onChange }: EditorColumnasPieProps) {
  return (
    <div className="flex flex-col gap-3">
      {columnas.map((columna, idx) => (
        <div key={columna.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
          <div className="mb-3 flex items-center justify-between">
            <TextField
              label=""
              value={columna.titulo}
              onChange={(v) => {
                const n = columnas.map((c, i) => (i === idx ? { ...c, titulo: v } : c))
                onChange(n)
              }}
              placeholder="Titulo de la columna"
            />
            <button
              type="button"
              onClick={() => onChange(columnas.filter((_, i) => i !== idx))}
              className="ml-2 text-gray-300 transition-colors hover:text-red-500"
            >
              <X className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {columna.enlaces.map((enlace, linkIdx) => (
              <div key={enlace.id} className="flex items-center gap-2">
                <TextField
                  label=""
                  value={enlace.texto}
                  onChange={(v) => {
                    const n = columnas.map((c, i) =>
                      i === idx
                        ? {
                            ...c,
                            enlaces: c.enlaces.map((l, li) =>
                              li === linkIdx ? { ...l, texto: v } : l,
                            ),
                          }
                        : c,
                    )
                    onChange(n)
                  }}
                  placeholder="Texto del enlace"
                />
                <TextField
                  label=""
                  value={enlace.href}
                  onChange={(v) => {
                    const n = columnas.map((c, i) =>
                      i === idx
                        ? {
                            ...c,
                            enlaces: c.enlaces.map((l, li) =>
                              li === linkIdx ? { ...l, href: v } : l,
                            ),
                          }
                        : c,
                    )
                    onChange(n)
                  }}
                  placeholder="/ruta"
                />
                <button
                  type="button"
                  onClick={() => {
                    const n = columnas.map((c, i) =>
                      i === idx
                        ? { ...c, enlaces: c.enlaces.filter((_, li) => li !== linkIdx) }
                        : c,
                    )
                    onChange(n)
                  }}
                  className="text-gray-300 transition-colors hover:text-red-500"
                >
                  <X className="h-3 w-3" strokeWidth={1.5} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const n = columnas.map((c, i) =>
                  i === idx
                    ? {
                        ...c,
                        enlaces: [...c.enlaces, { id: crypto.randomUUID(), texto: '', href: '' }],
                      }
                    : c,
                )
                onChange(n)
              }}
              className="text-[11px] font-medium text-secondary"
            >
              + Agregar enlace
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...columnas, { id: crypto.randomUUID(), titulo: '', enlaces: [] }])
        }
        className="rounded-xl border border-dashed border-gray-200 py-3 text-xs font-medium text-secondary transition-colors hover:border-secondary hover:bg-secondary/5"
      >
        + Agregar columna
      </button>
    </div>
  )
}
