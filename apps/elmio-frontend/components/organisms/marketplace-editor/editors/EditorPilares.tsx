import { useState } from 'react'
import { X } from 'lucide-react'
import { TextField } from '@/components/atoms/TextField/TextField'
import { TextArea } from '@/components/atoms/TextArea/TextArea'
import { ImagePicker } from '@/components/molecules/ImagePicker/ImagePicker'
import { ConfirmModal } from '@/components/molecules/ConfirmModal/ConfirmModal'
import type { PilarItem } from '@/src/utils/editor-types.d'

const ICON_OPTIONS = [
  { value: 'Award', label: 'Premio (Award)' },
  { value: 'Eye', label: 'Visión (Eye)' },
  { value: 'TrendingUp', label: 'Crecimiento (TrendingUp)' },
  { value: 'Shield', label: 'Escudo/Seguridad (Shield)' },
  { value: 'Heart', label: 'Salud/Corazón (Heart)' },
  { value: 'Star', label: 'Estrella (Star)' },
  { value: 'CheckCircle', label: 'Verificado (CheckCircle)' },
  { value: 'Users', label: 'Usuarios (Users)' },
  { value: 'Settings', label: 'Ajustes (Settings)' },
  { value: 'Zap', label: 'Rapidez (Zap)' },
  { value: 'Target', label: 'Objetivo (Target)' },
  { value: 'Activity', label: 'Actividad (Activity)' },
  { value: 'Lock', label: 'Privacidad (Lock)' },
  { value: 'Compass', label: 'Brújula (Compass)' },
  { value: 'HelpCircle', label: 'Soporte (HelpCircle)' },
  { value: 'Info', label: 'Información (Info)' },
]

interface EditorPilaresProps {
  pilares: PilarItem[]
  onChange: (pilares: PilarItem[]) => void
}

/**
 * Editor de pilares para la seccion de pilares y caracteristicas.
 * Permite agregar, editar y eliminar pilares con icono, titulo, texto y boton.
 */
export function EditorPilares({ pilares, onChange }: EditorPilaresProps) {
  const [pilarParaEliminarIdx, setPilarParaEliminarIdx] = useState<number | null>(null)

  const handleConfirmarEliminar = () => {
    if (pilarParaEliminarIdx !== null) {
      onChange(pilares.filter((_, i) => i !== pilarParaEliminarIdx))
      setPilarParaEliminarIdx(null)
    }
  }

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
              onClick={() => setPilarParaEliminarIdx(idx)}
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

            {/* Selector de tipo de icono: Personalizado o Lista */}
            <div className="flex items-center gap-2 my-1">
              <input
                type="checkbox"
                id={`esPersonalizado-${pilar.id}`}
                checked={pilar.esPersonalizado || false}
                onChange={(e) => {
                  const n = pilares.map((p, i) =>
                    i === idx
                      ? {
                          ...p,
                          esPersonalizado: e.target.checked,
                          icono: e.target.checked ? '' : 'Award',
                        }
                      : p
                  )
                  onChange(n)
                }}
                className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary cursor-pointer"
              />
              <label htmlFor={`esPersonalizado-${pilar.id}`} className="text-xs text-gray-600 font-medium cursor-pointer">
                Ícono personalizado (Subir imagen o URL física)
              </label>
            </div>

            {pilar.esPersonalizado ? (
              <ImagePicker
                label="Icono Personalizado"
                value={pilar.icono}
                onChange={(v) => {
                  const n = pilares.map((p, i) => (i === idx ? { ...p, icono: v } : p))
                  onChange(n)
                }}
              />
            ) : (
              <div className="flex flex-col gap-1 mb-2">
                <span className="text-xs font-semibold text-gray-500">Seleccionar Ícono de la Lista</span>
                <select
                  value={pilar.icono || 'Award'}
                  onChange={(e) => {
                    const n = pilares.map((p, i) => (i === idx ? { ...p, icono: e.target.value } : p))
                    onChange(n)
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
              icono: 'Award',
              titulo: '',
              texto: '',
              textoBoton: '',
              enlaceBoton: '',
              esPersonalizado: false,
            },
          ])
        }
        className="rounded-xl border border-dashed border-gray-200 py-3 text-xs font-medium text-secondary transition-colors hover:border-secondary hover:bg-secondary/5"
      >
        + Agregar pilar
      </button>

      <ConfirmModal
        isOpen={pilarParaEliminarIdx !== null}
        onClose={() => setPilarParaEliminarIdx(null)}
        onConfirm={handleConfirmarEliminar}
        title="¿Eliminar este pilar?"
        description="Este pilar y toda su información se borrarán de la sección. ¿Deseas continuar?"
        confirmText="Sí, eliminar pilar"
        cancelText="Cancelar"
      />
    </div>
  )
}
