'use client'

import { TextField } from '@/components/atoms/TextField/TextField'
import { FormGroup } from '@/components/molecules/FormGroup/FormGroup'
import { EditorPilares } from '../editors/EditorPilares'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface PanelPilaresProps {
  seccion: SeccionMarketplace
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
}

/**
 * Panel de contenido para seccion tipo pilares.
 * Permite editar encabezado y pilares.
 */
export function PanelPilares({ seccion, actualizarSeccion }: PanelPilaresProps) {
  return (
    <div className="flex flex-col gap-4">
      <FormGroup label="Encabezado">
        <TextField
          label="Titulo"
          value={seccion.contenido.titulo}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, titulo: v } })
          }
          placeholder="Ej: Por que elegirnos"
        />
        <TextField
          label="Subtitulo"
          value={seccion.contenido.subtitulo}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, subtitulo: v } })
          }
          placeholder="Texto auxiliar"
        />
      </FormGroup>
      <FormGroup label="Configuración">
        <div className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            id={`mostrarBoton-${seccion.id}`}
            checked={seccion.contenido.mostrarBoton ?? true}
            onChange={(e) =>
              actualizarSeccion(seccion.id, {
                contenido: { ...seccion.contenido, mostrarBoton: e.target.checked },
              })
            }
            className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary cursor-pointer"
          />
          <label htmlFor={`mostrarBoton-${seccion.id}`} className="text-sm text-gray-700 font-medium cursor-pointer">
            Mostrar botones en los pilares
          </label>
        </div>
      </FormGroup>
      <FormGroup label="Pilares">
        <EditorPilares
          pilares={seccion.contenido.pilares ?? []}
          onChange={(p) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, pilares: p } })
          }
        />
      </FormGroup>
    </div>
  )
}
