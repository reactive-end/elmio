'use client'

import { TextField } from '@/components/atoms/TextField/TextField'
import { TextArea } from '@/components/atoms/TextArea/TextArea'
import { FormGroup } from '@/components/molecules/FormGroup/FormGroup'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface PanelTextoProps {
  seccion: SeccionMarketplace
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
}

/**
 * Panel de contenido para seccion tipo texto.
 * Permite editar encabezado, texto plano y HTML enriquecido.
 */
export function PanelTexto({ seccion, actualizarSeccion }: PanelTextoProps) {
  return (
    <div className="flex flex-col gap-4">
      <FormGroup label="Encabezado">
        <TextField
          label="Titulo"
          value={seccion.contenido.titulo}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, titulo: v } })
          }
          placeholder="Titulo de la seccion"
        />
        <TextField
          label="Subtitulo"
          value={seccion.contenido.subtitulo}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, subtitulo: v } })
          }
          placeholder="Subtitulo"
        />
      </FormGroup>
      <FormGroup label="Cuerpo del texto">
        <TextArea
          label="Texto plano"
          value={seccion.contenido.descripcion}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, descripcion: v } })
          }
          placeholder="Texto del cuerpo de la seccion"
        />
      </FormGroup>
      <FormGroup label="HTML enriquecido (opcional)">
        <TextArea
          label="HTML"
          value={seccion.contenido.cuerpoHtml}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, cuerpoHtml: v } })
          }
          placeholder="<p>HTML personalizado...</p>"
        />
        <p className="text-xs text-gray-400">
          Si defines HTML, el renderizador usara este contenido en vez del texto plano.
        </p>
      </FormGroup>
    </div>
  )
}
