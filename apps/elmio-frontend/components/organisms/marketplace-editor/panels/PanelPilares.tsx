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
