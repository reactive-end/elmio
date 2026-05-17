'use client'

import { TextField } from '@/components/atoms/TextField/TextField'
import { TextArea } from '@/components/atoms/TextArea/TextArea'
import { FormGroup } from '@/components/molecules/FormGroup/FormGroup'
import { ImagePicker } from '@/components/molecules/ImagePicker/ImagePicker'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface PanelCaracteristicasProps {
  seccion: SeccionMarketplace
  actualizarContenido: (campo: keyof SeccionMarketplace['contenido'], valor: string) => void
}

/**
 * Panel de contenido para seccion tipo caracteristicas.
 * Permite editar encabezado, textos, imagen y boton. Los elementos se editan en la pestaña Elementos.
 */
export function PanelCaracteristicas({ seccion, actualizarContenido }: PanelCaracteristicasProps) {
  return (
    <div className="flex flex-col gap-4">
      <FormGroup label="Texto principal">
        <TextField
          label="Titulo"
          value={seccion.contenido.titulo}
          onChange={(v) => actualizarContenido('titulo', v)}
          placeholder="Ej: Tu futuro financiero, hoy."
        />
        <TextField
          label="Subtitulo"
          value={seccion.contenido.subtitulo}
          onChange={(v) => actualizarContenido('subtitulo', v)}
          placeholder="Un texto breve debajo del titulo"
        />
        <TextArea
          label="Descripcion"
          value={seccion.contenido.descripcion}
          onChange={(v) => actualizarContenido('descripcion', v)}
          placeholder="Texto descriptivo mas extenso..."
        />
      </FormGroup>
      <FormGroup label="Boton de accion">
        <TextField
          label="Texto del boton"
          value={seccion.contenido.textoBoton}
          onChange={(v) => actualizarContenido('textoBoton', v)}
          placeholder="Ej: Ver productos"
        />
        <TextField
          label="Pagina de destino"
          value={seccion.contenido.enlaceBoton}
          onChange={(v) => actualizarContenido('enlaceBoton', v)}
          placeholder="Ej: /productos"
        />
      </FormGroup>
      <FormGroup label="Imagen principal">
        <ImagePicker
          label="Imagen de la seccion"
          value={seccion.contenido.imagenUrl}
          onChange={(value) => actualizarContenido('imagenUrl', value)}
        />
      </FormGroup>
      <FormGroup label="Elementos de la grilla">
        <p className="text-xs text-gray-400">
          Agrega o ajusta los items desde la pestaña{' '}
          <span className="font-medium text-body">Elementos</span>.
        </p>
      </FormGroup>
    </div>
  )
}
