'use client'

import { X } from 'lucide-react'
import { TextField } from '@/components/atoms/TextField/TextField'
import { ImagePicker } from '@/components/molecules/ImagePicker/ImagePicker'
import type { AliadoLogo } from '@/src/utils/editor-types.d'

interface EditorAliadosProps {
  aliados: AliadoLogo[]
  onChange: (aliados: AliadoLogo[]) => void
}

/**
 * Editor de logos de aliados para la seccion de partners.
 * Permite agregar, editar y eliminar aliados con nombre, logo y enlace.
 */
export function EditorAliados({ aliados, onChange }: EditorAliadosProps) {
  return (
    <div className="flex flex-col gap-3">
      {aliados.map((aliado, idx) => (
        <div key={aliado.id} className="rounded-xl border border-gray-100 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Aliado {idx + 1}
            </span>
            <button
              type="button"
              onClick={() => onChange(aliados.filter((_, i) => i !== idx))}
              className="text-gray-300 transition-colors hover:text-red-500"
            >
              <X className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <TextField
              label="Nombre"
              value={aliado.nombre}
              onChange={(v) => {
                const n = aliados.map((a, i) => (i === idx ? { ...a, nombre: v } : a))
                onChange(n)
              }}
              placeholder="Ej: Mercantil Seguros"
            />
            <ImagePicker
              label="Logo"
              value={aliado.logo}
              onChange={(v) => {
                const n = aliados.map((a, i) => (i === idx ? { ...a, logo: v } : a))
                onChange(n)
              }}
            />
            <TextField
              label="Enlace"
              value={aliado.href}
              onChange={(v) => {
                const n = aliados.map((a, i) => (i === idx ? { ...a, href: v } : a))
                onChange(n)
              }}
              placeholder="/aliados/mercantil"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...aliados, { id: crypto.randomUUID(), nombre: '', logo: '', href: '' }])
        }
        className="rounded-xl border border-dashed border-gray-200 py-3 text-xs font-medium text-secondary transition-colors hover:border-secondary hover:bg-secondary/5"
      >
        + Agregar aliado
      </button>
    </div>
  )
}
