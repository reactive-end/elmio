'use client'

import { TextField } from '@/components/atoms/TextField/TextField'
import { TextArea } from '@/components/atoms/TextArea/TextArea'
import { FormGroup } from '@/components/molecules/FormGroup/FormGroup'
import { ImagePicker } from '@/components/molecules/ImagePicker/ImagePicker'
import { Select } from '@/components/atoms/Select/Select'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface PanelBannerProps {
  seccion: SeccionMarketplace
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
}

/**
 * Panel de contenido para seccion tipo banner.
 * Permite editar titulo, subtitulo, descripcion, imagen y boton de accion.
 */
export function PanelBanner({ seccion, actualizarSeccion }: PanelBannerProps) {
  return (
    <div className="flex flex-col gap-4">
      <FormGroup label="Texto principal">
        <TextField
          label="Titulo"
          value={seccion.contenido.titulo}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, titulo: v } })
          }
          placeholder="Ej: Eres una empresa?"
        />
        <TextField
          label="Subtitulo"
          value={seccion.contenido.subtitulo}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, subtitulo: v } })
          }
          placeholder="Texto secundario"
        />
        <TextArea
          label="Descripcion"
          value={seccion.contenido.descripcion}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, descripcion: v } })
          }
          placeholder="Texto descriptivo..."
        />
      </FormGroup>
      <FormGroup label="Imagen del banner">
        <ImagePicker
          label="Imagen"
          value={seccion.contenido.imagenUrl}
          onChange={(value) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, imagenUrl: value } })
          }
        />
        <div className="mt-2 space-y-1">
          <label className="text-xs font-semibold text-gray-500">Posición de la imagen</label>
          <Select
            value={seccion.contenido.imagenPosicion || 'derecha'}
            onChange={(v) =>
              actualizarSeccion(seccion.id, {
                contenido: { ...seccion.contenido, imagenPosicion: v },
              })
            }
            options={[
              { value: 'derecha', label: 'Derecha (Texto Izquierda)' },
              { value: 'izquierda', label: 'Izquierda (Texto Derecha)' },
            ]}
          />
        </div>
      </FormGroup>
      <FormGroup label="Accion">
        <TextField
          label="Texto del boton"
          value={seccion.contenido.textoBoton}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, textoBoton: v } })
          }
          placeholder="Ej: Ser aliado"
        />
        <TextField
          label="Pagina de destino"
          value={seccion.contenido.enlaceBoton}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, enlaceBoton: v } })
          }
          placeholder="Ej: /aliados"
        />
      </FormGroup>
    </div>
  )
}
