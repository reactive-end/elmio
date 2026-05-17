'use client'

import { TextField } from '@/components/atoms/TextField/TextField'
import { FormGroup } from '@/components/molecules/FormGroup/FormGroup'
import { EditorAliados } from '../editors/EditorAliados'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface PanelAliadosProps {
  seccion: SeccionMarketplace
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
}

/**
 * Panel de contenido para seccion tipo aliados.
 * Permite editar encabezado y logos de aliados.
 */
export function PanelAliados({ seccion, actualizarSeccion }: PanelAliadosProps) {
  return (
    <div className="flex flex-col gap-4">
      <FormGroup label="Encabezado">
        <TextField
          label="Titulo"
          value={seccion.contenido.titulo}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, titulo: v } })
          }
          placeholder="Ej: Nuestros aliados"
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
      <FormGroup label="Logos de aliados">
        <EditorAliados
          aliados={seccion.contenido.aliados ?? []}
          onChange={(a) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, aliados: a } })
          }
        />
      </FormGroup>
    </div>
  )
}
