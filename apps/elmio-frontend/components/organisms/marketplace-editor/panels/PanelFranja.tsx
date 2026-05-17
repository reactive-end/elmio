'use client'

import { TextField } from '@/components/atoms/TextField/TextField'
import { FormGroup } from '@/components/molecules/FormGroup/FormGroup'
import { SwitchField } from '@/components/molecules/SwitchField/SwitchField'
import { EditorDiapositivas } from '../editors/EditorDiapositivas'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface PanelFranjaProps {
  seccion: SeccionMarketplace
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
}

/**
 * Panel de contenido para seccion tipo franja.
 * Permite editar diapositivas con autoplay configurable.
 */
export function PanelFranja({ seccion, actualizarSeccion }: PanelFranjaProps) {
  return (
    <div className="flex flex-col gap-4">
      <FormGroup label="Diapositivas de la franja">
        <EditorDiapositivas
          diapositivas={seccion.contenido.diapositivas ?? []}
          onChange={(d) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, diapositivas: d } })
          }
        />
      </FormGroup>
      <SwitchField
        label="Reproduccion automatica"
        checked={seccion.contenido.autoplay}
        onChange={(v) =>
          actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, autoplay: v } })
        }
      />
      {seccion.contenido.autoplay && (
        <TextField
          label="Velocidad (ms)"
          value={String(seccion.contenido.autoplayVelocidad || 5000)}
          onChange={(v) =>
            actualizarSeccion(seccion.id, {
              contenido: { ...seccion.contenido, autoplayVelocidad: Number(v) || 5000 },
            })
          }
          placeholder="5000"
        />
      )}
    </div>
  )
}
