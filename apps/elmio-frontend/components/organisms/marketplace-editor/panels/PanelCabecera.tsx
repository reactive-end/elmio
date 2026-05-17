'use client'

import { TextField } from '@/components/atoms/TextField/TextField'
import { FormGroup } from '@/components/molecules/FormGroup/FormGroup'
import { ImagePicker } from '@/components/molecules/ImagePicker/ImagePicker'
import { EditorMenu } from '../editors/EditorMenu'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface PanelCabeceraProps {
  seccion: SeccionMarketplace
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
}

/**
 * Panel de contenido para seccion tipo cabecera.
 * Permite editar titulo, logo y menu de navegacion.
 */
export function PanelCabecera({ seccion, actualizarSeccion }: PanelCabeceraProps) {
  return (
    <div className="flex flex-col gap-4">
      <FormGroup label="Marca de la cabecera">
        <TextField
          label="Titulo de la pagina"
          value={seccion.contenido.titulo}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, titulo: v } })
          }
          placeholder="Ej: ElMio"
        />
        <ImagePicker
          label="Logo de la cabecera"
          value={seccion.contenido.logoUrl}
          onChange={(value) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, logoUrl: value } })
          }
        />
      </FormGroup>
      <FormGroup label="Menu de navegacion">
        <EditorMenu
          menu={seccion.contenido.menu ?? []}
          onChange={(menu) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, menu } })
          }
        />
      </FormGroup>
    </div>
  )
}
