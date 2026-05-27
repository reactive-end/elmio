'use client'

import { useMemo, useState } from 'react'
import { listGalleryImages, type GalleryServiceImage } from '@/src/services/gallery.service'
import type { UseImagePickerReturn } from './ImagePicker.d'
import { useMarketplaceEditorContext } from '@/components/organisms/marketplace-editor/MarketplaceEditorContext'

const DEFAULT_TENANT_DIRECTORY = 'elmio'

/**
 * Hook que administra la busqueda y carga de imagenes del picker conectado a la galeria.
 * @param selectedUrl URL actualmente seleccionada en el campo del editor.
 * @param tenantDirectory Directorio del tenant actual (opcional).
 * @returns Estado y acciones para abrir el picker y filtrar resultados.
 */
export function useImagePicker(
  selectedUrl: string,
  tenantDirectory?: string,
): UseImagePickerReturn {
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [images, setImages] = useState<GalleryServiceImage[]>([])

  const editorContext = useMarketplaceEditorContext()
  const rawTenant = tenantDirectory || editorContext?.tenantDirectory || DEFAULT_TENANT_DIRECTORY
  // Si el tenant evaluado es 'system', hacemos un fallback automático a 'elmio' ya que la galería administrativa unificada reside allí
  const activeTenantDirectory = rawTenant === 'system' ? 'elmio' : rawTenant

  const filteredImages = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) return images

    return images.filter((image) =>
      [image.name, image.storagePath].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      ),
    )
  }, [images, search])

  const selectedImage = useMemo(
    () => images.find((image) => image.previewUrl === selectedUrl) ?? null,
    [images, selectedUrl],
  )

  /**
   * Abre el picker y carga la biblioteca del tenant desde la API.
   * @returns Promesa resuelta cuando las imagenes del modal ya estan disponibles.
   */
  const openPicker = async (): Promise<void> => {
    setIsOpen(true)
    setIsLoading(true)

    try {
      const nextImages = await listGalleryImages(activeTenantDirectory)
      setImages(nextImages)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    search,
    isLoading,
    isOpen,
    images,
    filteredImages,
    selectedImage,
    setSearch,
    openPicker,
    closePicker: () => setIsOpen(false),
  }
}

