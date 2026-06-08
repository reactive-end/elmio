'use client'

import { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown, Trash2, ImageIcon } from 'lucide-react'
import { productService } from '@/src/services/product.service'
import { TextField } from '@/components/atoms/TextField/TextField'
import { TextArea } from '@/components/atoms/TextArea/TextArea'
import { FormGroup } from '@/components/molecules/FormGroup/FormGroup'
import { SwitchField } from '@/components/molecules/SwitchField/SwitchField'
import { SelectorProductos, type ProductoMarketplace } from '../SelectorProductos'
import type { SeccionMarketplace } from '@/src/utils/editor-types.d'

interface PanelProductosProps {
  seccion: SeccionMarketplace
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
}

/**
 * Panel de contenido para seccion tipo productos.
 * Permite editar encabezado, CTA, autoplay, selector de productos y su ordenamiento.
 */
export function PanelProductos({ seccion, actualizarSeccion }: PanelProductosProps) {
  const [productos, setProductos] = useState<ProductoMarketplace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true)
        setError(null)
        const data = await productService.list()
        
        // Mapear de Product (Backend) a ProductoMarketplace (Frontend)
        const mapped: ProductoMarketplace[] = data.map((p) => {
          const firstPrice = p.priceLists?.[0]
          const precioFormatted = firstPrice 
            ? `${firstPrice.currency === 'USD' ? '$' : firstPrice.currency}${firstPrice.amount}`
            : '$0'

          const firstWindow = p.windows?.[0]
          const accionTipo = firstWindow?.type === 'external-redirect' ? 'redirect' : 'trigger'
          
          return {
            id: p.id,
            nombre: p.name,
            categoria: p.category,
            precio: precioFormatted,
            imagenUrl: p.images?.[0] || '',
            accionTipo,
            accionEtiqueta: firstWindow?.label || 'Ver detalle',
            destinoUrl: firstWindow?.config?.redirectUrl || '',
          }
        })
        
        setProductos(mapped)
      } catch (err) {
        console.error('Error al cargar productos en el editor:', err)
        setError('No se pudieron cargar los productos.')
      } finally {
        setLoading(false)
      }
    }
    
    void loadProducts()
  }, [])

  const moverProducto = (index: number, direccion: 'subir' | 'bajar') => {
    const nuevosIds = [...(seccion.contenido.productosIds || [])]
    const targetIndex = direccion === 'subir' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= nuevosIds.length) return
    
    // Intercambiar
    const temp = nuevosIds[index]
    nuevosIds[index] = nuevosIds[targetIndex]
    nuevosIds[targetIndex] = temp
    
    actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, productosIds: nuevosIds } })
  }

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
          <div className="flex flex-col gap-4">
            {seccion.contenido.productosIds && seccion.contenido.productosIds.length > 0 && (
              <div className="border border-gray-200 bg-gray-50/50 rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Orden de visualización (izquierda a derecha)
                </p>
                <div className="flex flex-col gap-2">
                  {seccion.contenido.productosIds.map((id, index) => {
                    const prod = productos.find((p) => p.id === id)
                    if (!prod) return null
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between bg-white border border-gray-100 p-2 rounded-xl shadow-sm gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {prod.imagenUrl ? (
                              <img
                                src={prod.imagenUrl}
                                alt={prod.nombre}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageIcon className="w-4 h-4 animate-pulse" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-body truncate">
                              {prod.nombre}
                            </p>
                            <p className="text-[10px] text-secondary font-semibold">
                              {prod.precio}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moverProducto(index, 'subir')}
                            className="p-1 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                            title="Mover a la izquierda"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === seccion.contenido.productosIds.length - 1}
                            onClick={() => moverProducto(index, 'bajar')}
                            className="p-1 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                            title="Mover a la derecha"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nuevosIds = seccion.contenido.productosIds.filter((x) => x !== id)
                              actualizarSeccion(seccion.id, {
                                contenido: { ...seccion.contenido, productosIds: nuevosIds },
                              })
                            }}
                            className="p-1 rounded-lg border border-red-50 hover:bg-red-50 text-red-500 cursor-pointer ml-1 transition-colors"
                            title="Quitar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <SelectorProductos
              seleccionados={seccion.contenido.productosIds || []}
              productos={productos}
              loading={loading}
              error={error}
              onToggle={(productoId) => {
                const seleccionadosActualmente = seccion.contenido.productosIds || []
                const productoSeleccionado = seleccionadosActualmente.includes(productoId)
                const productosIds = productoSeleccionado
                  ? seleccionadosActualmente.filter((id) => id !== productoId)
                  : [...seleccionadosActualmente, productoId]
                actualizarSeccion(seccion.id, { contenido: { ...seccion.contenido, productosIds } })
              }}
            />
          </div>
        )}
      </FormGroup>
    </div>
  )
}

