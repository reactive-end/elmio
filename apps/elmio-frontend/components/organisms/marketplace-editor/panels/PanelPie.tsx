'use client'

import { TextField } from '@/components/atoms/TextField/TextField'
import { FormGroup } from '@/components/molecules/FormGroup/FormGroup'
import { ImagePicker } from '@/components/molecules/ImagePicker/ImagePicker'
import { EditorColumnasPie } from '../editors/EditorColumnasPie'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface PanelPieProps {
  seccion: SeccionMarketplace
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
}

/**
 * Panel de contenido para seccion tipo pie de pagina.
 * Permite editar marca, logo, copyright y columnas del footer.
 */
export function PanelPie({ seccion, actualizarSeccion }: PanelPieProps) {
  return (
    <div className="flex flex-col gap-4">
      <FormGroup label="Marca del pie">
        <TextField
          label="Titulo"
          value={seccion.contenido.titulo}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, titulo: v } })
          }
          placeholder="Ej: ElMio"
        />
        <TextField
          label="Descripcion"
          value={seccion.contenido.descripcion}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, descripcion: v } })
          }
          placeholder="Mensaje corto de marca"
        />
        <ImagePicker
          label="Logo"
          value={seccion.contenido.logoUrl}
          onChange={(value) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, logoUrl: value } })
          }
        />
        <TextField
          label="Copyright"
          value={seccion.contenido.copyright}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, copyright: v } })
          }
          placeholder="Ej: 2026 ElMio. Todos los derechos reservados."
        />
      </FormGroup>
      <FormGroup label="Columnas del pie">
        <EditorColumnasPie
          columnas={seccion.contenido.columnasPie ?? []}
          onChange={(c) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, columnasPie: c } })
          }
        />
      </FormGroup>
    </div>
  )
}
