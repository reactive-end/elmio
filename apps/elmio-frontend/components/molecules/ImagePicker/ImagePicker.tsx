'use client'

import Image from 'next/image'
import { ImageIcon, Search, X } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { useImagePicker } from './useImagePicker'
import type { ImagePickerProps } from './ImagePicker.d'

/**
 * Molecule que permite buscar y seleccionar imagenes de la galeria del tenant.
 * Incluye preview actual, busqueda por nombre y modal de seleccion visual.
 */
export function ImagePicker({
  label,
  value,
  onChange,
  tenantDirectory = 'elmio',
}: ImagePickerProps) {
  const {
    search,
    isLoading,
    isOpen,
    filteredImages,
    selectedImage,
    setSearch,
    openPicker,
    closePicker,
  } = useImagePicker(value, tenantDirectory)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[10px] font-medium text-gray-400">{label}</label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] font-medium text-gray-400 transition-colors hover:text-red-500"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="flex items-center gap-3 border-b border-gray-100 p-3">
          <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
            {value ? (
              <Image src={value} alt={label} fill unoptimized className="object-cover" />
            ) : (
              <ImageIcon className="h-5 w-5 text-gray-300" strokeWidth={1.5} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-body">
              {selectedImage?.name ?? (value ? 'Imagen seleccionada' : 'Sin imagen seleccionada')}
            </p>
            <p className="mt-1 truncate text-[11px] text-gray-400">
              {selectedImage?.storagePath ?? (value || 'Selecciona una imagen desde la galeria')}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => void openPicker()}
            className="px-4 py-2 text-xs"
          >
            Buscar imagen
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Biblioteca del tenant
                </p>
                <h3 className="mt-1 text-lg font-semibold text-body">Seleccionar imagen</h3>
              </div>
              <button
                type="button"
                onClick={closePicker}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-body"
                aria-label="Cerrar selector de imagen"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="border-b border-gray-100 px-6 py-4">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  strokeWidth={1.5}
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre o ruta"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {isLoading ? (
                <div className="flex min-h-[260px] items-center justify-center text-sm text-gray-400">
                  Cargando imagenes de la galeria...
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-2xl bg-secondary/8 p-4 text-secondary">
                    <ImageIcon className="h-7 w-7" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-body">No hay imagenes disponibles</p>
                  <p className="mt-2 max-w-sm text-sm text-gray-400">
                    Sube imagenes a la galeria del dashboard para poder reutilizarlas aqui.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredImages.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => {
                        onChange(image.previewUrl)
                        closePicker()
                      }}
                      className={`overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${value === image.previewUrl ? 'border-secondary ring-2 ring-secondary/20' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                        <Image
                          src={image.previewUrl}
                          alt={image.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <p className="truncate text-sm font-semibold text-body">{image.name}</p>
                        <p className="mt-1 truncate text-xs text-gray-400">{image.storagePath}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
