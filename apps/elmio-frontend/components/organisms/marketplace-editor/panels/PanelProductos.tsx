'use client'

import { TextField } from '@/components/atoms/TextField/TextField'
import { TextArea } from '@/components/atoms/TextArea/TextArea'
import { FormGroup } from '@/components/molecules/FormGroup/FormGroup'
import { SwitchField } from '@/components/molecules/SwitchField/SwitchField'
import { SelectorProductos } from '../SelectorProductos'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface PanelProductosProps {
  seccion: SeccionMarketplace
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
}

/**
 * Panel de contenido para seccion tipo productos.
 * Permite editar encabezado, CTA, autoplay y selector de productos del carrusel.
 */
export function PanelProductos({ seccion, actualizarSeccion }: PanelProductosProps) {
  return (
    <div className="flex flex-col gap-4">
      <FormGroup label="Encabezado del carrusel">
        <TextField
          label="Titulo"
          value={seccion.contenido.titulo}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, titulo: v } })
          }
          placeholder="Ej: Productos destacados"
        />
        <TextField
          label="Subtitulo"
          value={seccion.contenido.subtitulo}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, subtitulo: v } })
          }
          placeholder="Texto auxiliar del carrusel"
        />
        <TextArea
          label="Descripcion"
          value={seccion.contenido.descripcion}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, descripcion: v } })
          }
          placeholder="Mensaje de apoyo para la seccion"
        />
      </FormGroup>
      <FormGroup label="CTA global">
        <TextField
          label="Texto del boton (opcional)"
          value={seccion.contenido.textoBoton}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, textoBoton: v } })
          }
          placeholder="Ej: Ver todos los productos"
        />
        <TextField
          label="Pagina de destino"
          value={seccion.contenido.enlaceBoton}
          onChange={(v) =>
            actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, enlaceBoton: v } })
          }
          placeholder="Ej: /productos"
        />
      </FormGroup>
      <SwitchField
        label="Carrusel automatico"
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
      <FormGroup label="Productos del carrusel">
        <div className="mb-4">
          <SwitchField
            label="Auto-poblar (Mostrar los últimos productos dinámicamente)"
            checked={seccion.contenido.autoPoblarProductos ?? false}
            onChange={(v) =>
              actualizarSeccion(seccion.id, {
                contenido: { ...seccion.contenido, autoPoblarProductos: v },
              })
            }
          />
        </div>
        {!(seccion.contenido.autoPoblarProductos ?? false) && (
          <SelectorProductos
            seleccionados={seccion.contenido.productosIds}
            onToggle={(productoId) => {
              const productoSeleccionado = seccion.contenido.productosIds.includes(productoId)
              const productosIds = productoSeleccionado
                ? seccion.contenido.productosIds.filter((id) => id !== productoId)
                : [...seccion.contenido.productosIds, productoId]
              actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, productosIds } })
            }}
          />
        )}
      </FormGroup>
    </div>
  )
}
