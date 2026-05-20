'use client'

import { TextField } from '@/components/atoms/TextField/TextField'
import { FormGroup } from '@/components/molecules/FormGroup/FormGroup'
import { SwitchField } from '@/components/molecules/SwitchField/SwitchField'
import { EditorDiapositivas } from '../editors/EditorDiapositivas'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface PanelPrincipalProps {
  seccion: SeccionMarketplace
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
}

/**
 * Panel de contenido para seccion tipo principal (portada).
 * Permite editar diapositivas, autoplay y anclaje HTML.
 */
export function PanelPrincipal({ seccion, actualizarSeccion }: PanelPrincipalProps) {
  return (
    <div className="flex flex-col gap-4">
      <FormGroup label="Diapositivas de la Portada">
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
      <TextField
        label="ID HTML (anclaje)"
        value={seccion.contenido.htmlId}
        onChange={(v) =>
          actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, htmlId: v } })
        }
        placeholder="portada"
      />
    </div>
  )
}
