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

      <FormGroup label="Botones de Acción (CTA)">
        <TextField
          label="Texto botón Identificarse / Login"
          value={seccion.contenido.identifyButtonText || ''}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, identifyButtonText: v } })
          }
          placeholder="Ej: Iniciar Sesión"
        />
        <TextField
          label="Texto botón Carrito"
          value={seccion.contenido.cartButtonText || ''}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, cartButtonText: v } })
          }
          placeholder="Ej: Mi Carrito"
        />
      </FormGroup>

      <FormGroup label="Categorías rápidas del Menú">
        <TextField
          label="Categorías (separadas por coma)"
          value={seccion.contenido.categories?.join(', ') || ''}
          onChange={(v) =>
            actualizarSeccion(seccion.id, {
              contenido: {
                ...seccion.contenido,
                categories: v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [],
              },
            })
          }
          placeholder="Ej: Tecnología, Hogar, Moda, Ofertas"
        />
        <p className="text-[10px] text-gray-400">
          Escribe las categorías separándolas por comas para mostrarlas como atajos rápidos en el menú superior.
        </p>
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
