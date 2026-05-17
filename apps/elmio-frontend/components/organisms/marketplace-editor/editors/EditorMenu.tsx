'use client'

import { X } from 'lucide-react'
import { TextField } from '@/components/atoms/TextField/TextField'
import type { MenuItem } from '@/src/utils/editor-types.d'

interface EditorMenuProps {
  menu: MenuItem[]
  onChange: (menu: MenuItem[]) => void
}

/**
 * Editor de items de menu para la cabecera.
 * Permite agregar, editar y eliminar items con etiqueta y ruta.
 */
export function EditorMenu({ menu, onChange }: EditorMenuProps) {
  return (
    <div className="flex flex-col gap-3">
      {menu.map((item, idx) => (
        <div key={item.id} className="rounded-xl border border-gray-100 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Item {idx + 1}
            </span>
            <button
              type="button"
              onClick={() => onChange(menu.filter((_, i) => i !== idx))}
              className="text-gray-300 transition-colors hover:text-red-500"
            >
              <X className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <TextField
              label="Etiqueta"
              value={item.label}
              onChange={(v) => {
                const n = menu.map((m, i) => (i === idx ? { ...m, label: v } : m))
                onChange(n)
              }}
              placeholder="Ej: Productos"
            />
            <TextField
              label="Ruta"
              value={item.href}
              onChange={(v) => {
                const n = menu.map((m, i) => (i === idx ? { ...m, href: v } : m))
                onChange(n)
              }}
              placeholder="/productos"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...menu,
            { id: crypto.randomUUID(), label: '', href: '', icono: '', submenus: [] },
          ])
        }
        className="rounded-xl border border-dashed border-gray-200 py-3 text-xs font-medium text-secondary transition-colors hover:border-secondary hover:bg-secondary/5"
      >
        + Agregar item de menu
      </button>
    </div>
  )
}
