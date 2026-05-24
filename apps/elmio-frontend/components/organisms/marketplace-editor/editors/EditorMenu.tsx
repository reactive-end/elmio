'use client'

import { X } from 'lucide-react'
import { TextField } from '@/components/atoms/TextField/TextField'
import type { MenuItem } from '@/src/utils/editor-types.d'

const MENU_ICON_OPTIONS = [
  { value: '', label: 'Sin ícono' },
  { value: 'Home', label: 'Inicio (Home)' },
  { value: 'ShoppingBag', label: 'Tienda (ShoppingBag)' },
  { value: 'Grid', label: 'Categorías (Grid)' },
  { value: 'Users', label: 'Nosotros (Users)' },
  { value: 'Building', label: 'Compañía (Building)' },
  { value: 'Phone', label: 'Contacto (Phone)' },
  { value: 'Shield', label: 'Seguridad (Shield)' },
  { value: 'Award', label: 'Destacados (Award)' },
  { value: 'BookOpen', label: 'Blog / Recursos (BookOpen)' },
  { value: 'HelpCircle', label: 'Ayuda (HelpCircle)' },
  { value: 'Heart', label: 'Favoritos (Heart)' },
  { value: 'Settings', label: 'Ajustes (Settings)' },
  { value: 'Activity', label: 'Actividad (Activity)' },
  { value: 'Info', label: 'Información (Info)' },
  { value: 'Sparkles', label: 'Servicios (Sparkles)' },
  { value: 'MapPin', label: 'Ubicaciones (MapPin)' },
  { value: 'Briefcase', label: 'Trabajo (Briefcase)' },
  { value: 'Mail', label: 'Correo (Mail)' },
  { value: 'FileText', label: 'Documentos (FileText)' },
]

interface EditorMenuProps {
  menu: MenuItem[]
  onChange: (menu: MenuItem[]) => void
}

/**
 * Editor de items de menu para la cabecera.
 * Permite agregar, editar y eliminar items con etiqueta, ruta, íconos y submenús.
 */
export function EditorMenu({ menu, onChange }: EditorMenuProps) {
  return (
    <div className="flex flex-col gap-3">
      {menu.map((item, idx) => (
        <div key={item.id} className="rounded-xl border border-gray-100 p-3 bg-white">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Menú Principal {idx + 1}
            </span>
            <button
              type="button"
              onClick={() => onChange(menu.filter((_, i) => i !== idx))}
              className="text-gray-300 transition-colors hover:text-red-500"
            >
              <X className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <TextField
                label="Etiqueta"
                value={item.label}
                onChange={(v) => {
                  const n = menu.map((m, i) => (i === idx ? { ...m, label: v } : m))
                  onChange(n)
                }}
                placeholder="Ej: Home"
              />
              <TextField
                label="Ruta"
                value={item.href}
                onChange={(v) => {
                  const n = menu.map((m, i) => (i === idx ? { ...m, href: v } : m))
                  onChange(n)
                }}
                placeholder="/"
              />
            </div>

            <div className="flex flex-col gap-1 mb-2">
              <span className="text-xs font-semibold text-gray-500">Ícono del Menú</span>
              <select
                value={item.icono || ''}
                onChange={(e) => {
                  const n = menu.map((m, i) => (i === idx ? { ...m, icono: e.target.value } : m))
                  onChange(n)
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              >
                {MENU_ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-Editor para Submenús */}
            <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                Submenús ({item.submenus?.length || 0})
              </span>
              
              <div className="flex flex-col gap-2 mb-2">
                {(item.submenus || []).map((sub, sIdx) => (
                  <div key={sub.id} className="relative rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-gray-400">
                        Submenú {sIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedSubmenus = item.submenus.filter((_, si) => si !== sIdx)
                          const n = menu.map((m, i) => i === idx ? { ...m, submenus: updatedSubmenus } : m)
                          onChange(n)
                        }}
                        className="text-gray-300 transition-colors hover:text-red-500"
                      >
                        <X className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <TextField
                        label="Etiqueta"
                        value={sub.label}
                        onChange={(v) => {
                          const updatedSubmenus = item.submenus.map((s, si) => si === sIdx ? { ...s, label: v } : s)
                          const n = menu.map((m, i) => i === idx ? { ...m, submenus: updatedSubmenus } : m)
                          onChange(n)
                        }}
                        placeholder="Ej: Aliados"
                      />
                      <TextField
                        label="Ruta"
                        value={sub.href}
                        onChange={(v) => {
                          const updatedSubmenus = item.submenus.map((s, si) => si === sIdx ? { ...s, href: v } : s)
                          const n = menu.map((m, i) => i === idx ? { ...m, submenus: updatedSubmenus } : m)
                          onChange(n)
                        }}
                        placeholder="Ej: /aliados"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-500">Ícono</span>
                        <select
                          value={sub.icono || ''}
                          onChange={(e) => {
                            const updatedSubmenus = item.submenus.map((s, si) => si === sIdx ? { ...s, icono: e.target.value } : s)
                            const n = menu.map((m, i) => i === idx ? { ...m, submenus: updatedSubmenus } : m)
                            onChange(n)
                          }}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                        >
                          {MENU_ICON_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <TextField
                        label="Descripción"
                        value={sub.descripcion}
                        onChange={(v) => {
                          const updatedSubmenus = item.submenus.map((s, si) => si === sIdx ? { ...s, descripcion: v } : s)
                          const n = menu.map((m, i) => i === idx ? { ...m, submenus: updatedSubmenus } : m)
                          onChange(n)
                        }}
                        placeholder="Ej: Misión y aliados comerciales"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const newSub = { id: crypto.randomUUID(), label: '', href: '', descripcion: '', icono: 'Sparkles' }
                  const updatedSubmenus = [...(item.submenus || []), newSub]
                  const n = menu.map((m, i) => i === idx ? { ...m, submenus: updatedSubmenus } : m)
                  onChange(n)
                }}
                className="w-full rounded-lg border border-dashed border-gray-200 py-2 text-[11px] font-semibold text-gray-500 transition-colors hover:border-secondary hover:text-secondary hover:bg-secondary/5 cursor-pointer"
              >
                + Agregar submenú
              </button>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...menu,
            { id: crypto.randomUUID(), label: '', href: '', icono: 'Grid', submenus: [] },
          ])
        }
        className="rounded-xl border border-dashed border-gray-200 py-3 text-xs font-semibold text-secondary transition-colors hover:border-secondary hover:bg-secondary/5 cursor-pointer"
      >
        + Agregar item de menú
      </button>
    </div>
  )
}
