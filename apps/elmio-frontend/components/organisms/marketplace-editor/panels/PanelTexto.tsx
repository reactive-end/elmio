'use client'

import { TextField } from '@/components/atoms/TextField/TextField'
import { TextArea } from '@/components/atoms/TextArea/TextArea'
import { FormGroup } from '@/components/molecules/FormGroup/FormGroup'
import { RichTextEditor } from '@/components/molecules/RichTextEditor/RichTextEditor'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface PanelTextoProps {
  seccion: SeccionMarketplace
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
}

/**
 * Panel de contenido para seccion tipo texto.
 * Permite editar encabezado, texto plano y HTML enriquecido mediante un editor WYSIWYG.
 */
export function PanelTexto({ seccion, actualizarSeccion }: PanelTextoProps) {
  return (
    <div className="flex flex-col gap-4">
      <FormGroup label="Encabezado">
        <TextField
          label="Titulo de la seccion"
          value={seccion.contenido.titulo}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, titulo: v } })
          }
          placeholder="Ej: Nuestra mision y valores"
        />
        <TextField
          label="Subtitulo de la seccion"
          value={seccion.contenido.subtitulo}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, subtitulo: v } })
          }
          placeholder="Ej: Conoce mas sobre nosotros"
        />
      </FormGroup>
      
      <FormGroup label="Editor de texto con formato">
        <RichTextEditor
          label="Contenido visual"
          value={seccion.contenido.cuerpoHtml || ''}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, cuerpoHtml: v } })
          }
        />
        <p className="text-xs text-gray-400">
          Usa los botones superiores para formatear el texto. Este contenido se mostrara de forma prioritaria en la pagina.
        </p>
      </FormGroup>

      <FormGroup label="Texto simple alternativo (opcional)">
        <TextArea
          label="Texto sin formato"
          value={seccion.contenido.descripcion}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, descripcion: v } })
          }
          placeholder="Solo se utilizara si el editor de texto con formato esta vacio."
        />
      </FormGroup>
    </div>
  )
}
