'use client'

import { X } from 'lucide-react'
import { TextField } from '@/components/atoms/TextField/TextField'
import { FormGroup } from '@/components/molecules/FormGroup/FormGroup'
import { SwitchField } from '@/components/molecules/SwitchField/SwitchField'
import { ImagePicker } from '@/components/molecules/ImagePicker/ImagePicker'
import { EditorColumnasPie } from '../editors/EditorColumnasPie'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface PanelPieProps {
  seccion: SeccionMarketplace
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
}

/**
 * Panel de contenido para seccion tipo pie de pagina.
 * Permite editar marca, logo, copyright, switches de visibilidad, columnas y enlaces inferiores del footer.
 */
export function PanelPie({ seccion, actualizarSeccion }: PanelPieProps) {
  const linksBajo = seccion.contenido.bottomLinks ?? []

  const handleUpdateContent = (cambios: any) => {
    actualizarSeccion(seccion.id, {
      contenido: { ...seccion.contenido, ...cambios },
    })
  }

  const handleAddBottomLink = () => {
    const nuevoLink = { id: crypto.randomUUID(), label: '', href: '' }
    handleUpdateContent({ bottomLinks: [...linksBajo, nuevoLink] })
  }

  const handleUpdateBottomLink = (id: string, campo: string, valor: string) => {
    const actualizados = linksBajo.map((lnk) =>
      lnk.id === id ? { ...lnk, [campo]: valor } : lnk
    )
    handleUpdateContent({ bottomLinks: actualizados })
  }

  const handleRemoveBottomLink = (id: string) => {
    handleUpdateContent({ bottomLinks: linksBajo.filter((lnk) => lnk.id !== id) })
  }

  return (
    <div className="flex flex-col gap-4">
      <FormGroup label="Marca del pie">
        <TextField
          label="Titulo corporativo"
          value={seccion.contenido.titulo}
          onChange={(v) => handleUpdateContent({ titulo: v })}
          placeholder="Ej: ElMio"
        />
        <TextField
          label="Descripcion"
          value={seccion.contenido.descripcion}
          onChange={(v) => handleUpdateContent({ descripcion: v })}
          placeholder="Mensaje corto de marca"
        />
        <ImagePicker
          label="Logo del pie de página"
          value={seccion.contenido.logoUrl}
          onChange={(value) => handleUpdateContent({ logoUrl: value })}
        />
        <TextField
          label="Texto descriptivo alt del logo"
          value={seccion.contenido.logoAlt || ''}
          onChange={(v) => handleUpdateContent({ logoAlt: v })}
          placeholder="Ej: Logo ElMio"
        />
        <TextField
          label="Copyright"
          value={seccion.contenido.copyright}
          onChange={(v) => handleUpdateContent({ copyright: v })}
          placeholder="Ej: © 2026 ElMio. Todos los derechos reservados."
        />
      </FormGroup>

      <FormGroup label="Visibilidad Corporativa">
        <SwitchField
          label="Mostrar Logo"
          checked={seccion.contenido.showLogo ?? true}
          onChange={(v) => handleUpdateContent({ showLogo: v })}
        />
        <SwitchField
          label="Mostrar Descripción"
          checked={seccion.contenido.showDescription ?? true}
          onChange={(v) => handleUpdateContent({ showDescription: v })}
        />
        <SwitchField
          label="Mostrar Enlaces Inferiores Secundarios"
          checked={seccion.contenido.showBottomLinks ?? true}
          onChange={(v) => handleUpdateContent({ showBottomLinks: v })}
        />
      </FormGroup>

      <FormGroup label="Columnas del pie (Verticales)">
        <EditorColumnasPie
          columnas={seccion.contenido.columnasPie ?? []}
          onChange={(c) => handleUpdateContent({ columnasPie: c })}
        />
      </FormGroup>

      {(seccion.contenido.showBottomLinks ?? true) && (
        <FormGroup label="Enlaces Horizontales Inferiores (Bottom Links)">
          <div className="flex flex-col gap-2">
            {linksBajo.map((enlace) => (
              <div key={enlace.id} className="flex items-center gap-2">
                <TextField
                  label=""
                  value={enlace.label}
                  onChange={(v) => handleUpdateBottomLink(enlace.id, 'label', v)}
                  placeholder="Texto (ej: Privacidad)"
                />
                <TextField
                  label=""
                  value={enlace.href}
                  onChange={(v) => handleUpdateBottomLink(enlace.id, 'href', v)}
                  placeholder="/politica-de-privacidad"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveBottomLink(enlace.id)}
                  className="text-gray-300 transition-colors hover:text-red-500"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddBottomLink}
              className="text-[11px] font-medium text-secondary text-left self-start mt-1"
            >
              + Agregar enlace horizontal inferior
            </button>
          </div>
        </FormGroup>
      )}
    </div>
  )
}
