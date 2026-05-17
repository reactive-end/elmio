'use client'

import { TextField } from '@/components/atoms/TextField/TextField'
import { FormGroup } from '@/components/molecules/FormGroup/FormGroup'
import { ImagePicker } from '@/components/molecules/ImagePicker/ImagePicker'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface PanelDobleBannerProps {
  seccion: SeccionMarketplace
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
}

/**
 * Panel de contenido para seccion tipo doble-banner.
 * Permite editar dos banners lado a lado con titulo, imagen y boton.
 */
export function PanelDobleBanner({ seccion, actualizarSeccion }: PanelDobleBannerProps) {
  const banners = seccion.contenido.elementos.slice(0, 2)

  return (
    <div className="flex flex-col gap-4">
      <FormGroup label="Dos banners lado a lado">
        {[0, 1].map((idx) => {
          const banner = banners[idx]
          return (
            <div key={idx} className="rounded-xl border border-gray-100 p-3">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Banner {idx + 1}
              </p>
              <div className="flex flex-col gap-2">
                <TextField
                  label="Titulo"
                  value={banner?.titulo ?? ''}
                  onChange={(v) => {
                    const nuevos = [...banners]
                    if (nuevos[idx]) {
                      nuevos[idx] = { ...nuevos[idx], titulo: v }
                    } else {
                      nuevos[idx] = {
                        id: crypto.randomUUID(),
                        titulo: v,
                        descripcion: '',
                        icono: '',
                        imagenUrl: '',
                        enlaceUrl: '',
                        textoBoton: '',
                        enlaceBoton: '',
                      }
                    }
                    actualizarSeccion(seccion.id, {
                      contenido: { ...seccion.contenido, elementos: nuevos },
                    })
                  }}
                  placeholder="Titulo del banner"
                />
                <ImagePicker
                  label="Imagen"
                  value={banner?.imagenUrl ?? ''}
                  onChange={(v) => {
                    const nuevos = [...banners]
                    if (nuevos[idx]) {
                      nuevos[idx] = { ...nuevos[idx], imagenUrl: v }
                    } else {
                      nuevos[idx] = {
                        id: crypto.randomUUID(),
                        titulo: '',
                        descripcion: '',
                        icono: '',
                        imagenUrl: v,
                        enlaceUrl: '',
                        textoBoton: '',
                        enlaceBoton: '',
                      }
                    }
                    actualizarSeccion(seccion.id, {
                      contenido: { ...seccion.contenido, elementos: nuevos },
                    })
                  }}
                />
                <TextField
                  label="Texto del boton"
                  value={banner?.textoBoton ?? ''}
                  onChange={(v) => {
                    const nuevos = [...banners]
                    if (nuevos[idx]) nuevos[idx] = { ...nuevos[idx], textoBoton: v }
                    actualizarSeccion(seccion.id, {
                      contenido: { ...seccion.contenido, elementos: nuevos },
                    })
                  }}
                  placeholder="Texto del CTA"
                />
                <TextField
                  label="Enlace del boton"
                  value={banner?.enlaceBoton ?? ''}
                  onChange={(v) => {
                    const nuevos = [...banners]
                    if (nuevos[idx]) nuevos[idx] = { ...nuevos[idx], enlaceBoton: v }
                    actualizarSeccion(seccion.id, {
                      contenido: { ...seccion.contenido, elementos: nuevos },
                    })
                  }}
                  placeholder="/productos"
                />
              </div>
            </div>
          )
        })}
      </FormGroup>
    </div>
  )
}
